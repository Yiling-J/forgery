import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '../../db'
import { assetService } from '../asset'
import { settingService } from '../setting'
import { Prisma } from '../../generated/prisma'

interface AssetData {
  name: string
  type: string
  path: string // filename in example-data/assets
}

interface CharacterData {
  id: string
  name: string
  description: string | null
  asset: AssetData
}

interface EquipmentData {
  id: string
  name: string
  description: string
  category: string
  asset: AssetData
}

interface PoseData {
  id: string
  name: string
  asset: AssetData
}

interface ExpressionData {
  id: string
  name: string
  asset: AssetData
}

// Minimal generation data for seeding
interface GenerationData {
  id: string
  characterId: string
  userPrompt: string | null
  pose: string | null
  expression: string | null
  // In the original import, it had asset data.
  // We assume the asset file exists in example-data/assets
  asset: {
    name: string
    type: string
    path: string
  }
  equipmentIds: string[]
}

export default async function run() {
  const baseDir = 'example-data'
  const assetsDir = join(baseDir, 'assets')

  if (!existsSync(baseDir)) {
    console.log('No example data found, skipping seed.')
    return
  }

  // Check if we have data already to be safe
  const hasData = (await prisma.character.count()) > 0
  if (hasData) {
    console.log('Database already has data, skipping seed.')
    // Mark as initialized to prevent future checks
    await settingService.set('system_initialized', 'true')
    return
  }

  console.log('🌱 Seeding example data...')

  // Get Categories created by 001_migrateGenericCategory.ts
  const equipmentCategory = await prisma.category.findUnique({ where: { name: 'Equipment' } })
  const poseCategory = await prisma.category.findUnique({ where: { name: 'Pose' } })
  const expressionCategory = await prisma.category.findUnique({ where: { name: 'Expression' } })

  if (!equipmentCategory || !poseCategory || !expressionCategory) {
     throw new Error('Required categories not found for seeding example data. Ensure 001_migrateGenericCategory runs first.')
  }

  // Maps to link Generation data later
  const equipmentIdMap = new Map<string, string>()
  const poseIdMap = new Map<string, string>()
  const expressionIdMap = new Map<string, string>()

  // Helper to create asset
  const createAssetFromExample = async (assetData: AssetData) => {
    const filePath = join(assetsDir, assetData.path)
    const file = Bun.file(filePath)
    if (!(await file.exists())) {
      console.warn(`Example asset file not found: ${filePath}`)
      // Fallback or skip? Throwing might stop migration.
      // Let's create a placeholder or throw.
      throw new Error(`Example asset file not found: ${filePath}`)
    }
    const buffer = await file.arrayBuffer()
    return assetService.createAssetFromBuffer(buffer, {
      name: assetData.name,
      type: assetData.type,
    })
  }

  // 1. Characters
  const charFile = Bun.file(join(baseDir, 'characters.json'))
  if (await charFile.exists()) {
    const data: CharacterData[] = await charFile.json()
    for (const item of data) {
      try {
        const asset = await createAssetFromExample(item.asset)
        await prisma.character.create({
          data: {
            id: item.id,
            name: item.name,
            description: item.description,
            imageId: asset.id,
          },
        })
      } catch (e) {
        console.warn(`Failed to seed character ${item.name}`, e)
      }
    }
    console.log(`Imported ${data.length} characters`)
  }

  // 2. Equipments -> Data
  const equipFile = Bun.file(join(baseDir, 'equipments.json'))
  if (await equipFile.exists()) {
    const data: EquipmentData[] = await equipFile.json()
    for (const item of data) {
      try {
        const asset = await createAssetFromExample(item.asset)
        // Also create deprecated Equipment record for backward compatibility
        // Wait, instructions say: "create the equipment/pose/expression data in new table, not in the old Deprecated Tables."
        // But if I don't create them in deprecated tables, then existing code (like Outfit or old APIs) might break if they rely on them?
        // The user said: "existing users will skip 002 because 001 already migrate the table data, but new user will still run 002, so they would have example data when they first run the system."
        // And: "create the equipment/pose/expression data in new table, not in the old Deprecated Tables."
        // If I skip deprecated tables, I fulfill the "Data" table requirement.

        const dataRecord = await prisma.data.create({
          data: {
            categoryId: equipmentCategory.id,
            values: {
              name: item.name,
              description: item.description,
              category: item.category,
              image: asset.id, // Store Asset ID directly in JSON
            } as Prisma.InputJsonObject,
          },
        })
        equipmentIdMap.set(item.id, dataRecord.id)

        // For FULL backward compatibility during transition, we might want to also create the deprecated record?
        // User explicitly said "not in the old Deprecated Tables". So I will strictly follow that.
        // However, this means `Generation` creation below cannot use `equipments: { create: ... }` targeting `GenerationEquipment` table.
        // It must target `data: { connect: ... }`.

        // Also need to create deprecated Equipment record IF we want `Outfit` to work (as discussed before).
        // But strict instructions say "not in old Deprecated Tables".
        // I will follow instructions strictly. If Outfit breaks on clean install, it's out of scope for "Backend Refactor" unless explicitly included.
      } catch (e) {
         console.warn(`Failed to seed equipment ${item.name}`, e)
      }
    }
    console.log(`Imported ${data.length} equipments (as Data)`)
  }

  // 3. Poses -> Data
  const poseFile = Bun.file(join(baseDir, 'poses.json'))
  if (await poseFile.exists()) {
    const data: PoseData[] = await poseFile.json()
    for (const item of data) {
      try {
        const asset = await createAssetFromExample(item.asset)
        const dataRecord = await prisma.data.create({
          data: {
            categoryId: poseCategory.id,
            values: {
              name: item.name,
              image: asset.id,
            } as Prisma.InputJsonObject,
          },
        })
        poseIdMap.set(item.id, dataRecord.id)
      } catch (e) {
         console.warn(`Failed to seed pose ${item.name}`, e)
      }
    }
    console.log(`Imported ${data.length} poses (as Data)`)
  }

  // 4. Expressions -> Data
  const exprFile = Bun.file(join(baseDir, 'expressions.json'))
  if (await exprFile.exists()) {
    const data: ExpressionData[] = await exprFile.json()
    for (const item of data) {
      try {
        const asset = await createAssetFromExample(item.asset)
        const dataRecord = await prisma.data.create({
          data: {
            categoryId: expressionCategory.id,
            values: {
              name: item.name,
              image: asset.id,
            } as Prisma.InputJsonObject,
          },
        })
        expressionIdMap.set(item.id, dataRecord.id)
      } catch (e) {
         console.warn(`Failed to seed expression ${item.name}`, e)
      }
    }
    console.log(`Imported ${data.length} expressions (as Data)`)
  }

  // 5. Generations (Looks)
  const lookFile = Bun.file(join(baseDir, 'looks.json'))
  if (await lookFile.exists()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await lookFile.json()
    let importedCount = 0
    for (const item of data) {
      // Ensure character exists
      const characterExists = await prisma.character.findUnique({
        where: { id: item.characterId },
      })
      if (!characterExists) {
        continue
      }

      try {
        const asset = await createAssetFromExample(item.asset)

        // Prepare connections to Data table
        const dataToConnect: { id: string }[] = []

        // Link Pose
        if (item.pose && poseIdMap.has(item.pose)) {
          dataToConnect.push({ id: poseIdMap.get(item.pose)! })
        }

        // Link Expression
        if (item.expression && expressionIdMap.has(item.expression)) {
          dataToConnect.push({ id: expressionIdMap.get(item.expression)! })
        }

        // Link Equipments
        if (item.equipmentIds) {
          for (const eqId of item.equipmentIds) {
            if (equipmentIdMap.has(eqId)) {
              dataToConnect.push({ id: equipmentIdMap.get(eqId)! })
            }
          }
        }

        await prisma.generation.create({
          data: {
            id: item.id,
            characterId: item.characterId,
            userPrompt: item.userPrompt,
            // Deprecated fields are left null or not set
            // poseId: ...
            // expressionId: ...
            imageId: asset.id,
            data: {
              connect: dataToConnect,
            },
          },
        })
        importedCount++
      } catch (e) {
         console.warn(`Failed to seed generation ${item.id}`, e)
      }
    }
    console.log(`Imported ${importedCount} looks`)
  }

  // Set the legacy flag too, just in case
  await settingService.set('system_initialized', 'true')
  console.log('✅ Example data seeded')
}
