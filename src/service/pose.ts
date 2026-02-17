import { prisma } from '../db'
import { assetService } from './asset'

export interface PoseItem {
  id: string
  name: string
  imageUrl: string
}

export class PoseService {
  async listPoses(options: { page?: number; limit?: number } = {}): Promise<PoseItem[]> {
    const { page = 1, limit = 20 } = options
    const skip = (page - 1) * limit

    const customPoses = await prisma.pose.findMany({
      include: { image: true },
      orderBy: { id: 'desc' },
      skip: skip,
      take: limit,
    })

    return customPoses.map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: `/files/${p.image.path}`,
    }))
  }

  async createPose(name: string, file: File) {
    const asset = await assetService.createAsset(file, {
      name: name,
      type: file.type,
    })

    const pose = await prisma.pose.create({
      data: {
        name,
        imageId: asset.id,
      },
      include: { image: true },
    })

    return {
      id: pose.id,
      name: pose.name,
      imageUrl: `/files/${pose.image.path}`,
    } as PoseItem
  }

  async deletePose(id: string) {
    const pose = await prisma.pose.findUnique({
      where: { id },
    })

    if (!pose) {
      throw new Error('Pose not found')
    }

    await prisma.pose.delete({
      where: { id },
    })

    // Delete image asset
    await assetService.deleteAsset(pose.imageId)
  }
}

export const poseService = new PoseService()
