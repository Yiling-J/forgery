import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'

export class EquipmentService {
  static async listEquipments(
    pagination: { page: number; limit: number },
    filters?: { categoryId?: string; subCategoryId?: string },
  ) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit
    const where: Prisma.EquipmentWhereInput = {}

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId
    }
    if (filters?.subCategoryId) {
      where.subCategoryId = filters.subCategoryId
    }

    const [total, items] = await Promise.all([
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({
        where,
        skip,
        take: limit,
        include: {
          image: true,
          category: true,
          subCategory: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return { total, items, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
