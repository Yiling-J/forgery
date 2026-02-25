import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'

export class CollectionService {
  async listCollections(options: { page?: number; limit?: number; categoryId?: string }) {
    const { page = 1, limit = 20, categoryId } = options
    const skip = (page - 1) * limit

    const where: Prisma.CollectionWhereInput = {}
    if (categoryId) {
      where.categoryId = categoryId
    }

    const items = await prisma.collection.findMany({
      where,
      include: {
        items: {
          include: {
            data: {
              include: {
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    return items.map((collection) => ({
      ...collection,
      items: collection.items.map((i) => i.data),
    }))
  }

  async getCollection(id: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            data: {
              include: {
                image: true,
              },
            },
          },
        },
      },
    })
    if (!collection) return null
    return {
      ...collection,
      items: collection.items.map((i) => i.data),
    }
  }

  async createCollection(data: {
    name: string
    description?: string
    prompt?: string
    categoryId: string
    dataIds: string[]
  }) {
    const collection = await prisma.collection.create({
      data: {
        name: data.name,
        description: data.description,
        prompt: data.prompt,
        categoryId: data.categoryId,
        items: {
          create: data.dataIds.map((did) => ({
            dataId: did,
          })),
        },
      },
      include: {
        items: {
          include: {
            data: {
              include: {
                image: true,
              },
            },
          },
        },
      },
    })
    return {
      ...collection,
      items: collection.items.map((i) => i.data),
    }
  }

  async updateCollection(
    id: string,
    data: { name?: string; description?: string; prompt?: string; dataIds?: string[] },
  ) {
    const updateData: Prisma.CollectionUpdateInput = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.prompt !== undefined) updateData.prompt = data.prompt

    if (data.dataIds) {
      updateData.items = {
        deleteMany: {},
        create: data.dataIds.map((did) => ({
          dataId: did,
        })),
      }
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            data: {
              include: {
                image: true,
              },
            },
          },
        },
      },
    })

    return {
      ...collection,
      items: collection.items.map((i) => i.data),
    }
  }

  async deleteCollection(id: string) {
    return prisma.collection.delete({
      where: { id },
    })
  }
}

export const collectionService = new CollectionService()
