import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'

export class CategoryService {
  async listCategories(projectId: string) {
    return prisma.category.findMany({
      where: { projectId },
      orderBy: { name: 'asc' }
    })
  }

  async getCategory(id: string) {
    return prisma.category.findUnique({ where: { id } })
  }

  async createCategory(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data })
  }

  async updateCategory(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data })
  }

  async deleteCategory(id: string) {
    return prisma.category.delete({ where: { id } })
  }

  async listDataByCategory(categoryId: string, params: {
    page?: number
    limit?: number
    option?: string
  }) {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    const where: Prisma.DataWhereInput = {
        categoryId
    }
    if (params.option) {
        where.option = params.option
    }

    const [items, total] = await Promise.all([
      prisma.data.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { image: true }
      }),
      prisma.data.count({ where })
    ])

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export const categoryService = new CategoryService()
