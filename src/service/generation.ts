import { join } from 'path'
import { ulid } from 'ulidx'
import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'
import { aiService, type AIPart } from './ai'
import { assetService } from './asset'

export class GenerationService {
  async createGeneration(characterId: string, equipmentIds: string[]) {
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

    const prompt = `
    Task: Character Synthesis and Equipment Modification.

    1. Reference the 'Base Character' for pose, body type, facial features, and general art style.
    2. Reference the 'Equipment to equip' images.
    3. Generate a new image of the Base Character wearing the provided items.
    4. The items should replace existing clothing/armor in that slot (e.g. new helmet replaces old hat, armor replaces shirt).
    5. Seamlessly blend the items into the character's style.
    6. Maintain the exact pose and angle of the Base Character.
    7. High quality, detailed, game art style.
  `

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
            equipment: true,
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
              equipment: true,
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
