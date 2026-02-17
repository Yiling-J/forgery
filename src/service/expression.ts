import { prisma } from '../db'
import { assetService } from './asset'

export interface ExpressionItem {
  id: string
  name: string
  imageUrl: string
}

export class ExpressionService {
  async listExpressions(
    options: { page?: number; limit?: number } = {},
  ): Promise<ExpressionItem[]> {
    const { page = 1, limit = 20 } = options
    const skip = (page - 1) * limit

    const customExpressions = await prisma.expression.findMany({
      include: { image: true },
      orderBy: { id: 'desc' },
      skip: skip,
      take: limit,
    })

    return customExpressions.map((e) => ({
      id: e.id,
      name: e.name,
      imageUrl: `/files/${e.image.path}`,
    }))
  }

  async createExpression(name: string, file: File) {
    const asset = await assetService.createAsset(file, {
      name: name,
      type: file.type,
    })

    const expression = await prisma.expression.create({
      data: {
        name,
        imageId: asset.id,
      },
      include: { image: true },
    })

    return {
      id: expression.id,
      name: expression.name,
      imageUrl: `/files/${expression.image.path}`,
    } as ExpressionItem
  }

  async deleteExpression(id: string) {
    const expression = await prisma.expression.findUnique({
      where: { id },
    })

    if (!expression) {
      throw new Error('Expression not found')
    }

    await prisma.expression.delete({
      where: { id },
    })

    // Delete image asset
    await assetService.deleteAsset(expression.imageId)
  }
}

export const expressionService = new ExpressionService()
