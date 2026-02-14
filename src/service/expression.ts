import { ulid } from 'ulidx'
import { prisma } from '../db'
import { assetService } from './asset'

export interface ExpressionItem {
  id: string
  name: string
  type: 'builtin' | 'custom'
  imageUrl: string
}

export const BUILTIN_EXPRESSIONS: ExpressionItem[] = Array.from({ length: 9 }, (_, i) => i + 1).map(
  (i) => ({
    id: `expression_${i}.webp`,
    name: `Expression ${i}`,
    type: 'builtin',
    imageUrl: `/expressions/expression_${i}.webp`,
  }),
)

export class ExpressionService {
  async listExpressions(): Promise<ExpressionItem[]> {
    const customExpressions = await prisma.expression.findMany({
      include: { image: true },
      orderBy: { createdAt: 'desc' },
    })

    const formattedCustomExpressions: ExpressionItem[] = customExpressions.map((e) => ({
      id: e.id,
      name: e.name,
      type: 'custom',
      imageUrl: `/files/${e.image.path}`,
    }))

    return [...BUILTIN_EXPRESSIONS, ...formattedCustomExpressions]
  }

  async createExpression(name: string, file: File) {
    const asset = await assetService.createAsset(file, {
      name: name,
      type: file.type,
    })

    const expression = await prisma.expression.create({
      data: {
        id: ulid(),
        name,
        imageId: asset.id,
      },
      include: { image: true },
    })

    return {
      id: expression.id,
      name: expression.name,
      type: 'custom',
      imageUrl: `/files/${expression.image.path}`,
    } as ExpressionItem
  }

  async deleteExpression(id: string) {
    if (BUILTIN_EXPRESSIONS.some((e) => e.id === id)) {
      throw new Error('Cannot delete builtin expression')
    }

    const expression = await prisma.expression.findUnique({
      where: { id },
    })

    if (!expression) {
      throw new Error('Expression not found')
    }

    await prisma.expression.delete({
      where: { id },
    })
  }

  getBuiltinExpression(id: string) {
    return BUILTIN_EXPRESSIONS.find((e) => e.id === id)
  }
}

export const expressionService = new ExpressionService()
