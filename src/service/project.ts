import { prisma } from '../db'

export const projectService = {
  async listProjects() {
    // In order to fetch coverImage, we need to map over it manually or adjust schema.
    // Wait, `coverImageId` is just a string in schema. There's no relation defined!
    // Let me check prisma schema.
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { data: true, generations: true }
        }
      }
    })

    // Fetch corresponding assets for cover images
    const assetIds = projects.map(p => p.coverImageId).filter(Boolean) as string[]
    const assets = await prisma.asset.findMany({ where: { id: { in: assetIds } } })
    const assetMap = new Map(assets.map(a => [a.id, a]))

    return projects.map(p => ({
      ...p,
      coverImage: p.coverImageId ? assetMap.get(p.coverImageId) || null : null
    }))
  },

  async getProject(id: string) {
    return prisma.project.findUnique({
      where: { id },
    })
  },

  async createProject(data: { name: string; coverImageId?: string }) {
    return prisma.project.create({
      data,
    })
  },

  async updateProject(id: string, data: { name?: string; coverImageId?: string | null }) {
    return prisma.project.update({
      where: { id },
      data,
    })
  },

  async deleteProject(id: string) {
    return prisma.project.delete({
      where: { id },
    })
  },
}
