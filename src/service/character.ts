import { ulid } from 'ulidx'
import { prisma } from '../db'
import { assetService } from './asset'
import { generationService } from './generation'

export class CharacterService {
  async createCharacter(data: { name: string; description?: string; imageId: string }) {
    return prisma.character.create({
      data: {
        id: ulid(),
        ...data,
      },
      include: {
        image: true,
      },
    })
  }

  async listCharacters(pagination: { page: number; limit: number }) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit
    const [total, items] = await Promise.all([
      prisma.character.count(),
      prisma.character.findMany({
        skip,
        take: limit,
        include: {
          image: true,
          _count: {
            select: { generations: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return { total, items, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getCharacter(id: string) {
    return prisma.character.findUnique({
      where: { id },
      include: {
        image: true,
      },
    })
  }

  async updateCharacter(
    id: string,
    data: { name?: string; description?: string; imageId?: string },
  ) {
    return prisma.character.update({
      where: { id },
      data,
      include: {
        image: true,
      },
    })
  }

  async deleteCharacter(id: string) {
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        generations: true,
      },
    })

    if (!character) return

    // 1. Delete all generations (looks)
    for (const gen of character.generations) {
      await generationService.deleteGeneration(gen.id)
    }

    // 2. Delete character record
    await prisma.character.delete({
      where: { id },
    })

    // 3. Delete character image asset
    await assetService.deleteAsset(character.imageId)
  }
}

export const characterService = new CharacterService()
