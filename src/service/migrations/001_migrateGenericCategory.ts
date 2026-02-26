import { prisma } from '../../db'
import { EQUIPMENT_CATEGORIES } from '../../lib/categories'

export async function run() {
  console.log('Running 001_migrateGenericCategory...')

  // 1. Create Categories

  // Character Category
  const characterPrompt = {
    text: `Task: Character Extraction

Input: An image containing a character.
Target Character: {{name}}
Description: {{description}}

Instructions:
1. Identify the character described above in the input image.
2. Extract ONLY this character.
3. Place it on a pure white background (#FFFFFF).
4. Ensure the character is fully visible, centered, and cleanly isolated.
5. Remove all other elements (background, other characters, etc).
6. Maintain high quality and original details.
`,
    imageIds: [],
  }

  let characterCategory = await prisma.category.findFirst({ where: { name: 'Character' } })
  if (!characterCategory) {
    characterCategory = await prisma.category.create({
      data: {
        name: 'Character',
        description: 'Characters',
        imagePrompt: JSON.stringify(characterPrompt),
        enabled: true,
        options: JSON.stringify([]),
        maxCount: 1,
        withImage: true,
      },
    })
  }

  // Equipment Category
  const equipmentPrompt = {
    text: `Task: Asset Extraction

Input: An image containing a character with equipment.
Target Item: {{name}}
Description: {{description}}
Category: {{option}}
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
  }

  const equipmentOptions = EQUIPMENT_CATEGORIES.map((c) => c.main_category)

  let equipmentCategory = await prisma.category.findFirst({ where: { name: 'Equipment' } })
  if (!equipmentCategory) {
    equipmentCategory = await prisma.category.create({
      data: {
        name: 'Equipment',
        description: 'Character equipment and clothing',
        imagePrompt: JSON.stringify(equipmentPrompt),
        enabled: true,
        options: JSON.stringify(equipmentOptions),
        maxCount: 9,
        withImage: true,
      },
    })
  }

  // Pose Category
  const posePrompt = {
    text: `Task: Pose Extraction

Input: An image containing a character.
Target Pose: {{name}}
Description: {{description}}

Instructions:
1. Identify the character pose described above.
2. Extract the character in this pose.
3. Place on a pure white background (#FFFFFF).
4. Ensure the full pose is visible.
5. Remove background elements.
`,
    imageIds: [],
  }

  let poseCategory = await prisma.category.findFirst({ where: { name: 'Pose' } })
  if (!poseCategory) {
    poseCategory = await prisma.category.create({
      data: {
        name: 'Pose',
        description: 'Character poses',
        imagePrompt: JSON.stringify(posePrompt),
        enabled: true,
        options: JSON.stringify([]),
        maxCount: 1,
        withImage: true,
      },
    })
  }

  // Expression Category
  const expressionPrompt = {
    text: `Task: Expression Extraction

Input: An image containing a character.
Target Expression: {{name}}
Description: {{description}}

Instructions:
1. Identify the character expression described above.
2. Extract the character face/expression.
3. Place on a pure white background (#FFFFFF).
4. Focus on the facial expression.
`,
    imageIds: [],
  }

  let expressionCategory = await prisma.category.findFirst({ where: { name: 'Expression' } })
  if (!expressionCategory) {
    expressionCategory = await prisma.category.create({
      data: {
        name: 'Expression',
        description: 'Character expressions',
        imagePrompt: JSON.stringify(expressionPrompt),
        enabled: true,
        options: JSON.stringify([]),
        maxCount: 1,
        withImage: true,
      },
    })
  }

  // 2. Migrate Data (Preserve IDs)

  // Migrate Characters
  const characters = await prisma.character.findMany()
  for (const item of characters) {
    const exists = await prisma.data.findUnique({ where: { id: item.id } })
    if (!exists) {
        await prisma.data.create({
        data: {
            id: item.id,
            name: item.name,
            description: item.description || '',
            imageId: item.imageId,
            categoryId: characterCategory.id,
        },
        })
    }
  }
  console.log(`Migrated ${characters.length} characters`)


  // Migrate Equipments
  const equipments = await prisma.equipment.findMany()
  for (const item of equipments) {
    const exists = await prisma.data.findUnique({ where: { id: item.id } })
    if (!exists) {
        await prisma.data.create({
        data: {
            id: item.id,
            name: item.name,
            description: item.description,
            option: item.category,
            imageId: item.imageId,
            categoryId: equipmentCategory.id,
        },
        })
    }
  }
  console.log(`Migrated ${equipments.length} equipments`)

  // Migrate Poses
  const poses = await prisma.pose.findMany()
  for (const item of poses) {
    const exists = await prisma.data.findUnique({ where: { id: item.id } })
    if (!exists) {
        await prisma.data.create({
        data: {
            id: item.id,
            name: item.name,
            description: item.name,
            imageId: item.imageId,
            categoryId: poseCategory.id,
        },
        })
    }
  }
  console.log(`Migrated ${poses.length} poses`)

  // Migrate Expressions
  const expressions = await prisma.expression.findMany()
  for (const item of expressions) {
    const exists = await prisma.data.findUnique({ where: { id: item.id } })
    if (!exists) {
        await prisma.data.create({
        data: {
            id: item.id,
            name: item.name,
            description: item.name,
            imageId: item.imageId,
            categoryId: expressionCategory.id,
        },
        })
    }
  }
  console.log(`Migrated ${expressions.length} expressions`)

  // 3. Migrate Generation Relationships
  const generations = await prisma.generation.findMany({
      include: {
          equipments: true
      }
  })

  for (const gen of generations) {
      // Character
      // Every generation must link to its character in GenerationData
      const charExists = await prisma.generationData.findUnique({
        where: {
          generationId_dataId: {
            generationId: gen.id,
            dataId: gen.characterId
          }
        }
      })
      if (!charExists) {
        const dataExists = await prisma.data.findUnique({ where: { id: gen.characterId } })
        if (dataExists) {
          await prisma.generationData.create({
            data: {
              generationId: gen.id,
              dataId: gen.characterId
            }
          })
        }
      }

      // Pose
      if (gen.poseId) {
          // Check if link exists
          const exists = await prisma.generationData.findUnique({
              where: {
                  generationId_dataId: {
                      generationId: gen.id,
                      dataId: gen.poseId
                  }
              }
          })
          if (!exists) {
             // Check if data exists (it should if migrated above)
             const dataExists = await prisma.data.findUnique({ where: { id: gen.poseId }})
             if (dataExists) {
                 await prisma.generationData.create({
                     data: {
                         generationId: gen.id,
                         dataId: gen.poseId
                     }
                 })
             }
          }
      }

      // Expression
      if (gen.expressionId) {
          const exists = await prisma.generationData.findUnique({
              where: {
                  generationId_dataId: {
                      generationId: gen.id,
                      dataId: gen.expressionId
                  }
              }
          })
          if (!exists) {
             const dataExists = await prisma.data.findUnique({ where: { id: gen.expressionId }})
             if (dataExists) {
                 await prisma.generationData.create({
                     data: {
                         generationId: gen.id,
                         dataId: gen.expressionId
                     }
                 })
             }
          }
      }

      // Equipments
      for (const eq of gen.equipments) {
          const exists = await prisma.generationData.findUnique({
              where: {
                  generationId_dataId: {
                      generationId: gen.id,
                      dataId: eq.equipmentId
                  }
              }
          })
          if (!exists) {
             const dataExists = await prisma.data.findUnique({ where: { id: eq.equipmentId }})
             if (dataExists) {
                 await prisma.generationData.create({
                     data: {
                         generationId: gen.id,
                         dataId: eq.equipmentId
                     }
                 })
             }
          }
      }
  }
  console.log(`Migrated relationships for ${generations.length} generations`)

  // 4. Migrate Outfits to Collections
  const outfits = await prisma.outfit.findMany({
    include: {
      equipments: true,
    },
  })

  if (equipmentCategory) {
    for (const outfit of outfits) {
      const exists = await prisma.collection.findUnique({ where: { id: outfit.id } })
      if (!exists) {
        // Create Collection
        await prisma.collection.create({
          data: {
            id: outfit.id,
            name: outfit.name,
            prompt: outfit.prompt,
            categoryId: equipmentCategory.id,
            // We map existing equipment IDs to the new Collection items.
            // Since equipment IDs were preserved when migrating to Data, this works directly.
            items: {
              create: outfit.equipments.map((eq) => ({
                dataId: eq.equipmentId,
              })),
            },
          },
        })
      }
    }
    console.log(`Migrated ${outfits.length} outfits to collections`)
  } else {
    console.warn('Equipment category not found, skipping outfit migration')
  }
}
