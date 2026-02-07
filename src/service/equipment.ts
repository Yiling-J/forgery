import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'
import { ulid } from 'ulidx'

export class EquipmentService {
  /**
   * Lists equipment with pagination and optional filtering by category/subcategory.
   */
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

  /**
   * Saves a new equipment item, linking it to an asset (the refined image) and a category.
   */
  static async createEquipment(data: {
    name: string
    description: string
    imageId: string
    categoryId: string
    subCategoryId?: string
  }) {
    const id = ulid()

    return prisma.equipment.create({
      data: {
        id,
        name: data.name,
        description: data.description,
        imageId: data.imageId,
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
      },
      include: {
        image: true,
        category: true,
      }
    })
  }
}
