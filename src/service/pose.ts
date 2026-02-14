import { ulid } from 'ulidx'
import { prisma } from '../db'
import { assetService } from './asset'

export interface PoseItem {
  id: string
  name: string
  type: 'builtin' | 'custom'
  imageUrl: string
}

export const BUILTIN_POSES: PoseItem[] = Array.from({ length: 9 }, (_, i) => i + 1).map((i) => ({
  id: `character_pose_${i}.webp`,
  name: `Pose ${i}`,
  type: 'builtin',
  imageUrl: `/poses/character_pose_${i}.webp`,
}))

export class PoseService {
  async listPoses(): Promise<PoseItem[]> {
    const customPoses = await prisma.pose.findMany({
      include: { image: true },
      orderBy: { createdAt: 'desc' },
    })

    const formattedCustomPoses: PoseItem[] = customPoses.map((p) => ({
      id: p.id,
      name: p.name,
      type: 'custom',
      imageUrl: `/files/${p.image.path}`,
    }))

    return [...BUILTIN_POSES, ...formattedCustomPoses]
  }

  async createPose(name: string, file: File) {
    const asset = await assetService.createAsset(file, {
      name: name,
      type: file.type,
    })

    const pose = await prisma.pose.create({
      data: {
        id: ulid(),
        name,
        imageId: asset.id,
      },
      include: { image: true },
    })

    return {
      id: pose.id,
      name: pose.name,
      type: 'custom',
      imageUrl: `/files/${pose.image.path}`,
    } as PoseItem
  }

  async deletePose(id: string) {
    if (BUILTIN_POSES.some((p) => p.id === id)) {
      throw new Error('Cannot delete builtin pose')
    }

    const pose = await prisma.pose.findUnique({
      where: { id },
    })

    if (!pose) {
      throw new Error('Pose not found')
    }

    await prisma.pose.delete({
      where: { id },
    })
  }

  getBuiltinPose(id: string) {
    return BUILTIN_POSES.find((p) => p.id === id)
  }
}

export const poseService = new PoseService()
