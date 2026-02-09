import { prisma } from '../db'
import { ulid } from 'ulidx'

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
    return prisma.character.delete({
      where: { id },
    })
  }
}

export const characterService = new CharacterService()
