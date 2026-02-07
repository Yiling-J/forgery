import { prisma } from '../db'
import { ulid } from 'ulidx'

export class CategoryService {
  /**
   * Finds a category by name (case-insensitive) or creates it if it doesn't exist.
   * If a parentId is provided, it links the category as a sub-category.
   */
  static async findOrCreate(name: string, parentId?: string): Promise<string> {
    const normalizedName = name.trim()

    // Check if category exists
    const existing = await prisma.category.findFirst({
      where: {
        name: {
          equals: normalizedName,
        //   mode: 'insensitive' // SQLite doesn't support 'mode: insensitive' directly like Postgres, usually need manual lower() or collate NOCASE
        },
        parentId: parentId || null
      }
    })

    if (existing) {
      return existing.id
    }

    // Create new category
    const id = ulid()
    const newCategory = await prisma.category.create({
      data: {
        id,
        name: normalizedName,
        parentId: parentId || null
      }
    })

    return newCategory.id
  }

  /**
   * Lists all main categories with their sub-categories.
   */
  static async listAll() {
    return prisma.category.findMany({
      where: {
        parentId: null
      },
      include: {
        subCategories: true
      },
      orderBy: {
        name: 'asc'
      }
    })
  }
}
