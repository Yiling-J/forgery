import { expect, test, describe, mock, beforeEach } from 'bun:test'
import { prisma } from '../db'
import { assetService } from './asset'
import { PoseService } from './pose'

// Mock prisma
mock.module('../db', () => ({
  prisma: {
    pose: {
      findMany: mock(),
      create: mock(),
      findUnique: mock(),
      delete: mock(),
    },
  },
}))

// Mock assetService
mock.module('./asset', () => ({
  assetService: {
    createAsset: mock(),
    deleteAsset: mock(),
  },
}))

describe('PoseService', () => {
  let poseService: PoseService

  beforeEach(() => {
    poseService = new PoseService()
  })

  test('listPoses returns custom poses', async () => {
    const customPoses = [
      { id: 'custom1', name: 'Custom 1', image: { path: 'path1' } },
      { id: 'custom2', name: 'Custom 2', image: { path: 'path2' } },
    ]
    ;(prisma.pose.findMany as any).mockResolvedValue(customPoses)

    const poses = await poseService.listPoses()

    expect(poses.length).toBe(2)
    expect(poses.find((p) => p.id === 'custom1')).toBeDefined()
    expect(poses.find((p) => p.id === 'custom2')).toBeDefined()
  })

  test('createPose creates asset and pose', async () => {
    const file = new File([''], 'test.png', { type: 'image/png' })
    const assetId = 'asset1'

    ;(assetService.createAsset as any).mockResolvedValue({ id: assetId })
    ;(prisma.pose.create as any).mockResolvedValue({
      id: 'pose1',
      name: 'Test Pose',
      image: { path: 'path1' },
    })

    const result = await poseService.createPose('Test Pose', file)

    // @ts-ignore
    expect(assetService.createAsset).toHaveBeenCalledWith(file, {
      name: 'Test Pose',
      type: 'image/png',
    })
    // @ts-ignore
    expect(prisma.pose.create).toHaveBeenCalled()
    expect(result.id).toBe('pose1')
  })

  test('deletePose deletes pose', async () => {
    const customId = 'custom1'
    ;(prisma.pose.findUnique as any).mockResolvedValue({ id: customId, imageId: 'asset1' })
    ;(prisma.pose.delete as any).mockResolvedValue({ id: customId })

    await poseService.deletePose(customId)

    // @ts-ignore
    expect(prisma.pose.delete).toHaveBeenCalledWith({ where: { id: customId } })
    // @ts-ignore
    expect(assetService.deleteAsset).toHaveBeenCalledWith('asset1')
  })
})
