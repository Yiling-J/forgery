import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'

export class DataService {
  async getAllData(params: { categoryId?: string; search?: string }) {
    const where: Prisma.DataWhereInput = {}

    if (params.categoryId) {
      where.categoryId = params.categoryId
    }

    // Search is tricky with Json fields in Prisma + SQLite.
    // We can't easily perform `values ->> 'name' contains ...` in a generic way without raw query or specific knowledge of keys.
    // For now, if search is provided, we might need to fetch and filter in memory or rely on specific known fields.
    // However, the `Data` model is generic.
    // If the user searches "Red Shirt", we expect it to match `name` or `description`.
    // Let's defer complex search for now or implement a basic client-side search?
    // The requirement said "filtering capabilities, specifically ... by their associated Category".
    // I will implement category filtering first.

    return prisma.data.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
      },
    })
  }

  async getData(id: string) {
    return prisma.data.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })
  }

  async createData(data: Prisma.DataCreateInput) {
    return prisma.data.create({
      data,
    })
  }

  async updateData(id: string, data: Prisma.DataUpdateInput) {
    return prisma.data.update({
      where: { id },
      data,
    })
  }

  async deleteData(id: string) {
    return prisma.data.delete({
      where: { id },
    })
  }
}

export const dataService = new DataService()
