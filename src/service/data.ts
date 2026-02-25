import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'

export class DataService {
  // listData is removed as per requirement

  async getData(id: string) {
    return prisma.data.findUnique({
        where: { id },
        include: { image: true, category: true }
    })
  }

  async createData(data: Prisma.DataCreateInput) {
    return prisma.data.create({ data })
  }

  async updateData(id: string, data: Prisma.DataUpdateInput) {
    return prisma.data.update({ where: { id }, data })
  }

  async deleteData(id: string) {
    return prisma.data.delete({ where: { id } })
  }
}

export const dataService = new DataService()
