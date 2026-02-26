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

  async listGenerations(
    id: string,
    pagination: { page: number; limit: number }
  ) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const where: Prisma.GenerationWhereInput = {
      data: {
        some: {
          dataId: id
        }
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
          data: {
             include: {
                 data: {
                     include: {
                         image: true,
                         category: true
                     }
                 }
             }
          }
        },
        orderBy: {
          id: 'desc',
        },
      }),
    ])

    return { total, items, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

export const dataService = new DataService()
