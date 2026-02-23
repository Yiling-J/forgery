import { prisma } from '../db'
import { Prisma } from '../generated/prisma'

export class CategoryService {
  async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async getCategory(id: string) {
    return prisma.category.findUnique({
      where: { id },
    })
  }

  async createCategory(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({
      data,
    })
  }

  async updateCategory(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({
      where: { id },
      data,
    })
  }

  async deleteCategory(id: string) {
    return prisma.category.delete({
      where: { id },
    })
  }
}

export const categoryService = new CategoryService()
