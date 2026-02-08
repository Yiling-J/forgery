import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'

export class GenerationService {
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
