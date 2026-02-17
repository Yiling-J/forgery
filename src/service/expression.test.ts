import { expect, test, describe, mock, beforeEach } from 'bun:test'
import { prisma } from '../db'
import { assetService } from './asset'
import { ExpressionService } from './expression'

// Mock prisma
mock.module('../db', () => ({
  prisma: {
    expression: {
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

describe('ExpressionService', () => {
  let expressionService: ExpressionService

  beforeEach(() => {
    expressionService = new ExpressionService()
  })

  test('listExpressions returns custom expressions', async () => {
    const customExpressions = [
      { id: 'custom1', name: 'Custom 1', image: { path: 'path1' } },
      { id: 'custom2', name: 'Custom 2', image: { path: 'path2' } },
    ]
    ;(prisma.expression.findMany as any).mockResolvedValue(customExpressions)

    const expressions = await expressionService.listExpressions()

    expect(expressions.length).toBe(2)
    expect(expressions.find((e) => e.id === 'custom1')).toBeDefined()
    expect(expressions.find((e) => e.id === 'custom2')).toBeDefined()
  })

  test('createExpression creates asset and expression', async () => {
    const file = new File([''], 'test.png', { type: 'image/png' })
    const assetId = 'asset1'

    ;(assetService.createAsset as any).mockResolvedValue({ id: assetId })
    ;(prisma.expression.create as any).mockResolvedValue({
      id: 'expr1',
      name: 'Test Expression',
      image: { path: 'path1' },
    })

    const result = await expressionService.createExpression('Test Expression', file)

    // @ts-ignore
    expect(assetService.createAsset).toHaveBeenCalledWith(file, {
      name: 'Test Expression',
      type: 'image/png',
    })
    // @ts-ignore
    expect(prisma.expression.create).toHaveBeenCalled()
    expect(result.id).toBe('expr1')
  })

  test('deleteExpression deletes expression', async () => {
    const customId = 'custom1'
    ;(prisma.expression.findUnique as any).mockResolvedValue({ id: customId, imageId: 'asset1' })
    ;(prisma.expression.delete as any).mockResolvedValue({ id: customId })

    await expressionService.deleteExpression(customId)

    // @ts-ignore
    expect(prisma.expression.delete).toHaveBeenCalledWith({ where: { id: customId } })
    // @ts-ignore
    expect(assetService.deleteAsset).toHaveBeenCalledWith('asset1')
  })
})
