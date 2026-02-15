import { prisma } from '../db'
import { ulid } from 'ulidx'
import { Prisma } from '../generated/prisma/client'

export class OutfitService {
  async listOutfits(options: { page?: number; limit?: number } = {}, equipmentId?: string) {
    const { page = 1, limit = 20 } = options
    const skip = (page - 1) * limit

    const where: Prisma.OutfitWhereInput = {}
    if (equipmentId) {
      where.equipments = {
        some: {
          equipmentId,
        },
      }
    }

    return prisma.outfit.findMany({
      where,
      include: {
        equipments: {
          include: {
            equipment: {
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
  }

  async createOutfit(data: { name: string; prompt?: string; equipmentIds: string[] }) {
    const id = ulid()

    return prisma.outfit.create({
      data: {
        id,
        name: data.name,
        prompt: data.prompt,
        equipments: {
          create: data.equipmentIds.map((eid) => ({
            equipmentId: eid,
          })),
        },
      },
      include: {
        equipments: {
          include: {
            equipment: true,
          },
        },
      },
    })
  }

  async updateOutfit(
    id: string,
    data: { name?: string; prompt?: string; equipmentIds?: string[] },
  ) {
    const updateData: Prisma.OutfitUpdateInput = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.prompt !== undefined) updateData.prompt = data.prompt

    if (data.equipmentIds) {
      updateData.equipments = {
        deleteMany: {},
        create: data.equipmentIds.map((eid) => ({
          equipmentId: eid,
        })),
      }
    }

    return prisma.outfit.update({
      where: { id },
      data: updateData,
      include: {
        equipments: {
          include: {
            equipment: true,
          },
        },
      },
    })
  }

  async deleteOutfit(id: string) {
    return prisma.outfit.delete({
      where: { id },
    })
  }
}

export const outfitService = new OutfitService()
