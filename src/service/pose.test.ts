import { expect, test, describe, mock } from 'bun:test'
import { prisma } from '../db'
import { assetService } from './asset'

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
  test('listPoses returns builtin + custom poses', async () => {
    // @ts-ignore
    const { poseService, BUILTIN_POSES } = await import(`./pose?v=${Date.now()}`)

    // Setup custom poses mock
    const customPoses = [{ id: 'custom1', name: 'Custom 1', image: { path: 'path1' } }]
    ;(prisma.pose.findMany as any).mockResolvedValue(customPoses)

    const poses = await poseService.listPoses()

    expect(poses.length).toBe(BUILTIN_POSES.length + 1)
    expect(poses.find((p: any) => p.id === 'custom1')).toBeDefined()
    expect(poses.find((p: any) => p.type === 'custom')).toBeDefined()
    expect(poses.find((p: any) => p.type === 'builtin')).toBeDefined()
  })

  test('createPose creates asset and pose', async () => {
    // @ts-ignore
    const { poseService } = await import(`./pose?v=${Date.now()}`)

    const file = new File([''], 'test.png', { type: 'image/png' })
    const assetId = 'asset1'

    ;(assetService.createAsset as any).mockResolvedValue({ id: assetId })
    ;(prisma.pose.create as any).mockResolvedValue({
      id: 'pose1',
      name: 'Test Pose',
      image: { path: 'path1' },
    })

    const result = await poseService.createPose('Test Pose', file)

    expect(assetService.createAsset).toHaveBeenCalledWith(file, {
      name: 'Test Pose',
      type: 'image/png',
    })
    expect(prisma.pose.create).toHaveBeenCalled()
    expect(result.id).toBe('pose1')
  })

  test('deletePose throws for builtin pose', async () => {
    // @ts-ignore
    const { poseService, BUILTIN_POSES } = await import(`./pose?v=${Date.now()}`)

    const builtinId = BUILTIN_POSES[0].id
    expect(poseService.deletePose(builtinId)).rejects.toThrow('Cannot delete builtin pose')
  })

  test('deletePose deletes custom pose', async () => {
    // @ts-ignore
    const { poseService } = await import(`./pose?v=${Date.now()}`)

    const customId = 'custom1'
    ;(prisma.pose.findUnique as any).mockResolvedValue({ id: customId, imageId: 'asset1' })
    ;(prisma.pose.delete as any).mockResolvedValue({ id: customId })

    await poseService.deletePose(customId)

    expect(prisma.pose.delete).toHaveBeenCalledWith({ where: { id: customId } })
    expect(assetService.deleteAsset).toHaveBeenCalledWith('asset1')
  })
})
