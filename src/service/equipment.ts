import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'
import { assetService } from './asset'

export class EquipmentService {
  /**
   * Lists equipment with pagination and optional filtering by category/subcategory.
   */
  async listEquipments(
    pagination: { page: number; limit: number },
    filters?: { category?: string[]; subCategory?: string },
  ) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit
    const where: Prisma.EquipmentWhereInput = {}

    if (filters?.category && filters.category.length > 0) {
      where.category = { in: filters.category }
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
          id: 'desc',
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
    return prisma.equipment.create({
      data: {
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

  /**
   * Updates an existing equipment item.
   */
  async updateEquipment(
    id: string,
    data: {
      name?: string
      description?: string
    },
  ) {
    return prisma.equipment.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        image: true,
      },
    })
  }

  /**
   * Deletes an equipment item and its associated asset.
   */
  async deleteEquipment(id: string) {
    const equipment = await prisma.equipment.findUnique({
      where: { id },
    })

    if (!equipment) return

    // Delete related GenerationEquipment records manually since there is no cascade
    await prisma.generationEquipment.deleteMany({
      where: { equipmentId: id },
    })

    // Delete equipment
    await prisma.equipment.delete({
      where: { id },
    })

    // Delete associated asset
    // Note: We assume the asset is exclusive to this equipment, which is true for extracted assets.
    if (equipment.imageId) {
      try {
        await assetService.deleteAsset(equipment.imageId)
      } catch (e) {
        console.warn(`Failed to delete asset ${equipment.imageId} for equipment ${id}`, e)
      }
    }

    return equipment
  }
}

export const equipmentService = new EquipmentService()
