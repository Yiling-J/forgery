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
  async listPoses(options: { page?: number; limit?: number } = {}): Promise<PoseItem[]> {
    const { page = 1, limit = 20 } = options
    const skip = (page - 1) * limit

    // Logic for mixed pagination
    const builtinCount = BUILTIN_POSES.length

    // Calculate how many builtin items to include
    const builtinStart = skip
    const builtinEnd = Math.min(builtinCount, skip + limit)
    const builtinSlice =
      builtinStart < builtinCount ? BUILTIN_POSES.slice(builtinStart, builtinEnd) : []

    // Calculate how many db items to fetch
    const remainingLimit = limit - builtinSlice.length
    const dbSkip = Math.max(0, skip - builtinCount)

    let formattedCustomPoses: PoseItem[] = []

    if (remainingLimit > 0) {
      const customPoses = await prisma.pose.findMany({
        include: { image: true },
        orderBy: { createdAt: 'desc' },
        skip: dbSkip,
        take: remainingLimit,
      })

      formattedCustomPoses = customPoses.map((p) => ({
        id: p.id,
        name: p.name,
        type: 'custom',
        imageUrl: `/files/${p.image.path}`,
      }))
    }

    return [...builtinSlice, ...formattedCustomPoses]
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

    // Delete image asset
    await assetService.deleteAsset(pose.imageId)
  }

  getBuiltinPose(id: string) {
    return BUILTIN_POSES.find((p) => p.id === id)
  }
}

export const poseService = new PoseService()
