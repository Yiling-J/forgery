import { join } from 'path'
import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'
import { aiService, type AIPart } from './ai'
import { assetService } from './asset'

export class GenerationService {
  async createGeneration(
    dataIds: string[],
    userPrompt?: string
  ) {
    // 1. Fetch all data items with their images and categories
    const dataItems = await prisma.data.findMany({
      where: { id: { in: dataIds } },
      include: {
          image: true,
          category: true
      },
    })

    if (dataItems.length !== dataIds.length) {
        throw new Error('Some items were not found')
    }

    // Identify Character (Base)
    const character = dataItems.find(d => d.category.name === 'Character')
    if (!character) {
        throw new Error('No character selected as base')
    }

    // Identify Modifiers (Equipment, Pose, Expression)
    // We treat everything else as a modifier
    const modifiers = dataItems.filter(d => d.id !== character.id)

    // 2. Construct parts
    const parts: AIPart[] = []

    // Base Character
    if (!character.image) throw new Error('Character has no image')
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

    // Process Modifiers
    let poseInstruction = '6. Maintain the exact pose and angle of the Base Character.'
    let expressionInstruction = '7. Maintain the facial expression of the Base Character.'

    for (const item of modifiers) {
        if (!item.image) continue;

        const itemPath = join('data/files', item.image.path)
        const itemFile = Bun.file(itemPath)
        const itemBuffer = await itemFile.arrayBuffer()
        const itemBase64 = Buffer.from(itemBuffer).toString('base64')

        parts.push({
            inlineData: {
                mimeType: item.image.type,
                data: itemBase64,
            }
        })

        if (item.category.name === 'Pose') {
             parts.push({ text: 'Target Pose Reference' })
             poseInstruction = "6. Use the 'Target Pose Reference' image for the character's pose and angle."
        } else if (item.category.name === 'Expression') {
             parts.push({ text: 'Target Expression Reference' })
             expressionInstruction = "7. Use the 'Target Expression Reference' image for the character's facial expression."
        } else {
             // Equipment or other
             parts.push({
                text: `
Equipment to equip:
name: ${item.name}
description: ${item.description}
category: ${item.option || item.category.name}
`,
              })
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

    // 3. Generate Image
    const generatedImageBase64 = await aiService.generateImage(
      parts,
      undefined,
      'step_generation_model',
    )

    // 4. Save generated image as Asset
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

    // 5. Create Generation record
    const generation = await prisma.generation.create({
      data: {
        characterId: character.id, // Keep backward compatibility for now
        imageId: asset.id,
        userPrompt: userPrompt,
        // Create GenerationData links for ALL items (Character + Modifiers)
        data: {
            create: dataItems.map(d => ({
                dataId: d.id
            }))
        }
      },
      include: {
        image: true,
        data: {
            include: {
                data: {
                    include: {
                        image: true,
                        category: true // Include Category for result if needed immediately
                    }
                }
            }
        }
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

    // Deprecated filter support
    if (filters?.characterId) {
      where.characterId = filters.characterId
    }

    // Support new generic filtering via GenerationData if needed,
    // but the requirement was specifically about fetching generations FOR a data item,
    // which is handled in DataService.listGenerations.
    // This method is for global listing.

    const [total, items] = await Promise.all([
      prisma.generation.count({ where }),
      prisma.generation.findMany({
        where,
        skip,
        take: limit,
        include: {
          image: true,
          data: {
            include: {
                data: {
                    include: {
                        image: true,
                        category: true
                    }
                }
            }
          }
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
    await prisma.generationData.deleteMany({
        where: { generationId: id }
    })

    // Delete deprecated relations just in case
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
