import { join } from 'path'
import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'
import { aiService, type AIPart } from './ai'
import { assetService } from './asset'

export class GenerationService {
  async createGeneration(
    characterId: string,
    equipmentIds: string[],
    userPrompt?: string,
    poseId?: string,
    expressionId?: string,
  ) {
    // 1. Fetch character and its image
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: { image: true },
    })

    if (!character) {
      throw new Error('Character not found')
    }

    // 2. Fetch equipments and their images
    const equipments = await prisma.equipment.findMany({
      where: { id: { in: equipmentIds } },
      include: { image: true },
    })

    // 3. Construct parts
    const parts: AIPart[] = []

    // Base Character
    const charPath = join('data/files', character.image.path)
    const charFile = Bun.file(charPath)
    const charBuffer = await charFile.arrayBuffer()
    const charBase64 = Buffer.from(charBuffer).toString('base64')

    parts.push({
      inlineData: {
        mimeType: character.image.type,
        data: charBase64,
      },
    })
    parts.push({ text: 'Base Character Reference' })

    // Equipments
    for (const eq of equipments) {
      const eqPath = join('data/files', eq.image.path)
      const eqFile = Bun.file(eqPath)
      const eqBuffer = await eqFile.arrayBuffer()
      const eqBase64 = Buffer.from(eqBuffer).toString('base64')

      parts.push({
        inlineData: {
          mimeType: eq.image.type,
          data: eqBase64,
        },
      })

      parts.push({
        text: `
Equipment to equip:
name: ${eq.name}
description: ${eq.description}
category: ${eq.category}
`,
      })
    }

    // Handle Pose
    let poseInstruction = '6. Maintain the exact pose and angle of the Base Character.'

    if (poseId) {
      const pose = await prisma.pose.findUnique({
        where: { id: poseId },
        include: { image: true },
      })

      if (pose) {
        const posePath = join('data/files', pose.image.path)
        const file = Bun.file(posePath)
        const poseBuffer = await file.arrayBuffer()
        const poseBase64 = Buffer.from(poseBuffer).toString('base64')

        parts.push({
          inlineData: {
            mimeType: pose.image.type,
            data: poseBase64,
          },
        })
        parts.push({ text: 'Target Pose Reference' })

        poseInstruction =
          "6. Use the 'Target Pose Reference' image for the character's pose and angle."
      } else {
        // Fallback for transition: if user hasn't migrated example data yet, poseId might be missing.
        // We log a warning but proceed without the pose, or we could throw.
        // Given strict requirement, throwing might be better, but let's be safe and just ignore if not found?
        // Actually, if the user explicitly selected a pose, they expect it to work. Throwing is better.
        throw new Error(`Pose not found: ${poseId}`)
      }
    }

    // Handle Expression
    let expressionInstruction = '7. Maintain the facial expression of the Base Character.'

    if (expressionId) {
      const expression = await prisma.expression.findUnique({
        where: { id: expressionId },
        include: { image: true },
      })

      if (expression) {
        const expressionPath = join('data/files', expression.image.path)
        const file = Bun.file(expressionPath)
        const expressionBuffer = await file.arrayBuffer()
        const expressionBase64 = Buffer.from(expressionBuffer).toString('base64')

        parts.push({
          inlineData: {
            mimeType: expression.image.type,
            data: expressionBase64,
          },
        })
        parts.push({ text: 'Target Expression Reference' })

        expressionInstruction =
          "7. Use the 'Target Expression Reference' image for the character's facial expression."
      } else {
        throw new Error(`Expression not found: ${expressionId}`)
      }
    }

    let prompt = `
    Task: Character Synthesis and Equipment Modification.

    1. Reference the 'Base Character' for pose, body type, facial features, and general art style.
    2. Reference the 'Equipment to equip' images.
    3. Generate a new image of the Base Character wearing the provided items.
    4. The items should replace existing clothing/armor in that slot (e.g. new helmet replaces old hat, armor replaces shirt).
    5. Seamlessly blend the items into the character's style.
    ${poseInstruction}
    ${expressionInstruction}
    8. High quality, detailed, game art style.
  `

    if (userPrompt) {
      prompt += `
    User Requirements:
    ${userPrompt}
    IMPORTANT: You must strictly adhere to the User Requirements above.
      `
    }

    parts.push({ text: prompt })

    // 4. Generate Image
    const generatedImageBase64 = await aiService.generateImage(
      parts,
      undefined,
      'step_generation_model',
    )

    // 5. Save generated image as Asset
    const matches = generatedImageBase64.match(/^data:(.+);base64,(.+)$/)
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid generated image format')
    }
    const mimeType = matches[1]
    const data = matches[2]
    const buffer = Buffer.from(data, 'base64')

    const ext = '.' + (mimeType.split('/')[1] || 'png')

    const asset = await assetService.createAssetFromBuffer(buffer, {
      name: `${character.name} - Outfit Generation`,
      type: mimeType,
      ext: ext,
    })

    // 6. Create Generation record
    const generation = await prisma.generation.create({
      data: {
        characterId: character.id,
        imageId: asset.id,
        userPrompt: userPrompt,
        poseId: poseId,
        expressionId: expressionId,
        equipments: {
          create: equipmentIds.map((eqId) => ({
            equipmentId: eqId,
          })),
        },
      },
      include: {
        image: true,
        character: true,
        pose: { include: { image: true } },
        expression: { include: { image: true } },
        equipments: {
          include: {
            equipment: {
              include: {
                image: true,
              },
            },
          },
        },
      },
    })

    return generation
  }

  async listGenerations(
    pagination: { page: number; limit: number },
    filters?: { characterId?: string; equipmentId?: string },
  ) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit
    const where: Prisma.GenerationWhereInput = {}

    if (filters?.characterId) {
      where.characterId = filters.characterId
    }

    if (filters?.equipmentId) {
      where.equipments = {
        some: {
          equipmentId: filters.equipmentId,
        },
      }
    }

    const [total, items] = await Promise.all([
      prisma.generation.count({ where }),
      prisma.generation.findMany({
        where,
        skip,
        take: limit,
        include: {
          image: true,
          character: true,
          pose: { include: { image: true } },
          expression: { include: { image: true } },
          equipments: {
            include: {
              equipment: {
                include: {
                  image: true,
                },
              },
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
      }),
    ])

    return { total, items, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async deleteGeneration(id: string) {
    const generation = await prisma.generation.findUnique({
      where: { id },
    })

    if (!generation) return

    // Delete relation records first (not strictly needed with cascading deletes, but safe)
    await prisma.generationEquipment.deleteMany({
      where: { generationId: id },
    })

    // Delete generation record
    await prisma.generation.delete({
      where: { id },
    })

    // Delete image asset (this also deletes the file)
    await assetService.deleteAsset(generation.imageId)
  }
}

export const generationService = new GenerationService()
