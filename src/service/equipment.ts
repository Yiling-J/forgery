import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'
import { ulid } from 'ulidx'

export class EquipmentService {
  /**
   * Lists equipment with pagination and optional filtering by category/subcategory.
   */
  async listEquipments(
    pagination: { page: number; limit: number },
    filters?: { category?: string; subCategory?: string },
  ) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit
    const where: Prisma.EquipmentWhereInput = {}

    if (filters?.category) {
      where.category = filters.category
    }
    if (filters?.subCategory) {
      where.subCategory = filters.subCategory
    }

    const [total, items] = await Promise.all([
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({
        where,
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

  /**
   * Saves a new equipment item, linking it to an asset (the refined image) and a category.
   */
  async createEquipment(data: {
    name: string
    description: string
    imageId: string
    category: string
    subCategory?: string
  }) {
    const id = ulid()

    return prisma.equipment.create({
      data: {
        id,
        name: data.name,
        description: data.description,
        imageId: data.imageId,
        category: data.category,
        subCategory: data.subCategory,
      },
      include: {
        image: true,
      },
    })
  }
}

export const equipmentService = new EquipmentService()
