import { join } from 'path'
import { ulid } from 'ulidx'
import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'
import { aiService, type AIPart } from './ai'
import { assetService } from './asset'
import { poseService } from './pose'

export class GenerationService {
  async createGeneration(
    characterId: string,
    equipmentIds: string[],
    userPrompt?: string,
    poseId?: string,
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
      let poseBuffer: ArrayBuffer
      let poseMimeType: string

      const builtinPose = poseService.getBuiltinPose(poseId)
      if (builtinPose) {
        const posePath = join('public/poses', poseId)
        const file = Bun.file(posePath)
        poseBuffer = await file.arrayBuffer()
        poseMimeType = file.type || 'image/webp'
      } else {
        const customPose = await prisma.pose.findUnique({
          where: { id: poseId },
          include: { image: true },
        })

        if (!customPose) {
          throw new Error(`Pose not found: ${poseId}`)
        }

        const posePath = join('data/files', customPose.image.path)
        const file = Bun.file(posePath)
        poseBuffer = await file.arrayBuffer()
        poseMimeType = customPose.image.type
      }

      const poseBase64 = Buffer.from(poseBuffer).toString('base64')
      parts.push({
        inlineData: {
          mimeType: poseMimeType,
          data: poseBase64,
        },
      })
      parts.push({ text: 'Target Pose Reference' })

      poseInstruction =
        "6. Use the 'Target Pose Reference' image for the character's pose and angle."
    }

    let prompt = `
    Task: Character Synthesis and Equipment Modification.

    1. Reference the 'Base Character' for pose, body type, facial features, and general art style.
    2. Reference the 'Equipment to equip' images.
    3. Generate a new image of the Base Character wearing the provided items.
    4. The items should replace existing clothing/armor in that slot (e.g. new helmet replaces old hat, armor replaces shirt).
    5. Seamlessly blend the items into the character's style.
    ${poseInstruction}
    7. High quality, detailed, game art style.
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
    const generationId = ulid()
    await prisma.generation.create({
      data: {
        id: generationId,
        characterId: character.id,
        imageId: asset.id,
        userPrompt: userPrompt,
        pose: poseId,
      },
    })

    // Create relation records
    if (equipmentIds.length > 0) {
      await prisma.generationEquipment.createMany({
        data: equipmentIds.map((eqId) => ({
          generationId: generationId,
          equipmentId: eqId,
        })),
      })
    }

    // Return generation with included relations
    return prisma.generation.findUnique({
      where: { id: generationId },
      include: {
        image: true,
        character: true,
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
          createdAt: 'desc',
        },
      }),
    ])

    return { total, items, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

export const generationService = new GenerationService()
