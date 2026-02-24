import { prisma } from '../../db'
import { EQUIPMENT_CATEGORIES } from '../../lib/categories'
import { Prisma } from '../../generated/prisma/client'

export default async function run() {
  console.log('Starting Generic Category Migration...')

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create Categories
      const equipmentCategory = await tx.category.create({
        data: {
          name: 'Equipment',
          description: 'Clothing and accessories',
          maxCount: 9,
          fields: [
            { key: 'name', type: 'text', label: 'Name' },
            { key: 'description', type: 'text', label: 'Description' },
            {
              key: 'category',
              type: 'select',
              label: 'Category',
              options: EQUIPMENT_CATEGORIES,
            },
            { key: 'image', type: 'image', label: 'Image' },
          ] as Prisma.InputJsonArray,
          imagePrompt: {
            text: `Task: Asset Extraction

Input: An image containing a character with equipment.
Target Item: {{name}}
Description: {{description}}
Category: {{category}}
User Hint: {{hint}}

Instructions:
1. Identify the specific item described above in the input image.
2. Extract ONLY this item.
3. Place it on a pure white background (#FFFFFF).
4. Ensure the item is fully visible, centered, and cleanly isolated.
5. Remove all other elements (character body, other items, background).
6. Maintain high quality and original details.
7. Return ONLY the image of the isolated equipment on a white background.`,
            imageIds: [],
          } as Prisma.InputJsonObject,
        },
      })

      const poseCategory = await tx.category.create({
        data: {
          name: 'Pose',
          description: 'Character poses',
          maxCount: 1,
          fields: [
            { key: 'name', type: 'text', label: 'Name' },
            { key: 'image', type: 'image', label: 'Image' },
          ] as Prisma.InputJsonArray,
          imagePrompt: {
            text: 'Extract pose from image',
            imageIds: [],
          } as Prisma.InputJsonObject,
        },
      })

      const expressionCategory = await tx.category.create({
        data: {
          name: 'Expression',
          description: 'Character expressions',
          maxCount: 1,
          fields: [
            { key: 'name', type: 'text', label: 'Name' },
            { key: 'image', type: 'image', label: 'Image' },
          ] as Prisma.InputJsonArray,
          imagePrompt: {
            text: 'Extract expression from image',
            imageIds: [],
          } as Prisma.InputJsonObject,
        },
      })

      // 2. Migrate Equipment -> Data
      const equipments = await tx.equipment.findMany()
      const equipmentIdMap = new Map<string, string>()

      for (const item of equipments) {
        const data = await tx.data.create({
          data: {
            categoryId: equipmentCategory.id,
            values: {
              name: item.name,
              description: item.description,
              category: item.category,
              image: item.imageId,
            } as Prisma.InputJsonObject,
          },
        })
        equipmentIdMap.set(item.id, data.id)
      }

      // 3. Migrate Pose -> Data
      const poses = await tx.pose.findMany()
      const poseIdMap = new Map<string, string>()

      for (const item of poses) {
        const data = await tx.data.create({
          data: {
            categoryId: poseCategory.id,
            values: {
              name: item.name,
              image: item.imageId,
            } as Prisma.InputJsonObject,
          },
        })
        poseIdMap.set(item.id, data.id)
      }

      // 4. Migrate Expression -> Data
      const expressions = await tx.expression.findMany()
      const expressionIdMap = new Map<string, string>()

      for (const item of expressions) {
        const data = await tx.data.create({
          data: {
            categoryId: expressionCategory.id,
            values: {
              name: item.name,
              image: item.imageId,
            } as Prisma.InputJsonObject,
          },
        })
        expressionIdMap.set(item.id, data.id)
      }

      // 5. Migrate Generation Relationships
      const generations = await tx.generation.findMany({
        include: {
          equipments: true,
        },
      })

      for (const gen of generations) {
        const dataToConnect: { id: string }[] = []

        // Link Pose
        if (gen.poseId && poseIdMap.has(gen.poseId)) {
          dataToConnect.push({ id: poseIdMap.get(gen.poseId)! })
        }

        // Link Expression
        if (gen.expressionId && expressionIdMap.has(gen.expressionId)) {
          dataToConnect.push({ id: expressionIdMap.get(gen.expressionId)! })
        }

        // Link Equipments (GenerationEquipment)
        for (const genEq of gen.equipments) {
          if (equipmentIdMap.has(genEq.equipmentId)) {
            dataToConnect.push({ id: equipmentIdMap.get(genEq.equipmentId)! })
          }
        }

        if (dataToConnect.length > 0) {
          await tx.generation.update({
            where: { id: gen.id },
            data: {
              data: {
                connect: dataToConnect,
              },
            },
          })
        }
      }
    })

    console.log('Generic Category Migration completed successfully.')
  } catch (error) {
    console.error('Generic Category Migration failed:', error)
    throw error
  }
}
