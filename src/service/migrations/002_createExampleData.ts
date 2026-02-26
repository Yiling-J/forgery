import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '../../db'
import { assetService } from '../asset'

// Types
interface AssetData {
  name: string
  type: string
  path: string
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

interface GenerationData {
  id: string
  characterId: string
  userPrompt: string | null
  pose: string | null
  expression: string | null
  asset: AssetData
  equipmentIds: string[]
}

export async function run() {
  console.log('Running 002_createExampleData...')

  const baseDir = 'example-data'
  const assetsDir = join(baseDir, 'assets')

  if (!existsSync(baseDir)) {
      console.log('No example data found, skipping import.')
      return
  }

  const getCategory = async (name: string) => {
      const cat = await prisma.category.findFirst({ where: { name } })
      if (!cat) throw new Error(`Category ${name} not found`)
      return cat
  }

  const charCategory = await getCategory('Character')
  const equipCategory = await getCategory('Equipment')
  const poseCategory = await getCategory('Pose')
  const exprCategory = await getCategory('Expression')

  const createAssetFromExample = async (assetData: AssetData) => {
    const filePath = join(assetsDir, assetData.path)
    const file = Bun.file(filePath)
    if (!(await file.exists())) {
      throw new Error(`Example asset file not found: ${filePath}`)
    }
    const buffer = await file.arrayBuffer()
    return assetService.createAssetFromBuffer(buffer, {
      name: assetData.name,
      type: assetData.type,
    })
  }

  // 1. Characters -> Data
  const charFile = Bun.file(join(baseDir, 'characters.json'))
  if (await charFile.exists()) {
      const data: CharacterData[] = await charFile.json()
      for (const item of data) {
         // Check both Character (legacy) and Data (new) tables?
         // Actually, if we are in a fresh db, we should just insert into Data
         // But to keep backward compat or if migration 001 runs first...
         // Migration 001 runs first and creates Category.
         // If we insert into Data, we are good.
         // If we insert into Character, 001 handles it? No, 001 only runs ONCE.
         // If we are resetting DB, 001 runs (creating empty tables/cats), then 002 runs.
         // So 002 should insert directly into Data for new schema.

         // Insert into Data
         const exists = await prisma.data.findUnique({ where: { id: item.id } })
         if (!exists) {
            const asset = await createAssetFromExample(item.asset)
            await prisma.data.create({
                data: {
                    id: item.id,
                    name: item.name,
                    description: item.description || '',
                    imageId: asset.id,
                    categoryId: charCategory.id
                },
            })

            // Also insert into deprecated Character table for safety if needed by any old code not yet updated?
            // Or better, just Data. Our new code uses Data.
            // But we must populate legacy Character table IF there is code relying on it?
            // My changes updated Character API to use DataService/Data model?
            // Actually, I replaced Character API logic to use DataService.
            // And I updated Frontend to use Data API.
            // So we don't need `Character` table populated technically.
            // BUT `Generation.characterId` is still a foreign key to `Character`.
            // So if I create a Generation, it might fail if `characterId` points to `Character` table which is empty.
            // Let's check `schema.prisma`.
            // `characterId String @map("character_id")`
            // `character Character @relation(fields: [characterId], references: [id])`
            // YES, we MUST populate `Character` table too because `Generation` table has a hard relation to it.
            // Unless I remove that relation. I deprecated it but didn't remove it from schema.
            // So I must populate `Character` table.

            const charExists = await prisma.character.findUnique({ where: { id: item.id } })
            if (!charExists) {
                await prisma.character.create({
                    data: {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        imageId: asset.id
                    }
                })
            }
         }
      }
      console.log(`Checked/Imported characters`)
  }

  // 2. Equipments -> Data
  const equipFile = Bun.file(join(baseDir, 'equipments.json'))
  if (await equipFile.exists()) {
      const data: EquipmentData[] = await equipFile.json()
      for (const item of data) {
        const existing = await prisma.data.findUnique({ where: { id: item.id } })
        if (!existing) {
            const asset = await createAssetFromExample(item.asset)
            await prisma.data.create({
                data: {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    option: item.category,
                    categoryId: equipCategory.id,
                    imageId: asset.id,
                }
            })
            // Deprecated Equipment table population? Not strictly required by FK unless GenerationEquipment uses it.
            // GenerationEquipment -> Equipment. Yes.
            // We need to populate deprecated tables if we want `Generation` creation (which might still write to deprecated fields) to work?
            // My updated `GenerationService` writes to `data` (GenerationData).
            // But `prisma.generation.create` in `GenerationService` does:
            // data: { characterId: character.id ... }
            // So it NEEDS `Character` record.
            // Does it need `Equipment` record?
            // `equipments` relation in `Generation` was removed from `create` call in my `GenerationService` update.
            // I only populate `data` (GenerationData).
            // So `Equipment` table might not be needed for `Generation`.
            // But `Character` table IS needed.
        }
      }
      console.log(`Checked/Imported equipments`)
  }

  // 3. Poses -> Data
  const poseFile = Bun.file(join(baseDir, 'poses.json'))
  if (await poseFile.exists()) {
      const data: PoseData[] = await poseFile.json()
      for (const item of data) {
         const existing = await prisma.data.findUnique({ where: { id: item.id } })
         if (!existing) {
            const asset = await createAssetFromExample(item.asset)
            await prisma.data.create({
                data: {
                    id: item.id,
                    name: item.name,
                    description: item.name,
                    categoryId: poseCategory.id,
                    imageId: asset.id,
                }
            })
         }
      }
      console.log(`Checked/Imported poses`)
  }

  // 4. Expressions -> Data
  const exprFile = Bun.file(join(baseDir, 'expressions.json'))
  if (await exprFile.exists()) {
      const data: ExpressionData[] = await exprFile.json()
      for (const item of data) {
         const existing = await prisma.data.findUnique({ where: { id: item.id } })
         if (!existing) {
            const asset = await createAssetFromExample(item.asset)
            await prisma.data.create({
                data: {
                    id: item.id,
                    name: item.name,
                    description: item.name,
                    categoryId: exprCategory.id,
                    imageId: asset.id,
                }
            })
         }
      }
      console.log(`Checked/Imported expressions`)
  }

  // 5. Generations
  const lookFile = Bun.file(join(baseDir, 'looks.json'))
  if (await lookFile.exists()) {
      const data: GenerationData[] = await lookFile.json()
      for (const item of data) {
        const existing = await prisma.generation.findUnique({ where: { id: item.id } })
        if (!existing) {
             const characterExists = await prisma.character.findUnique({
                where: { id: item.characterId },
            })
            if (!characterExists) continue

            const asset = await createAssetFromExample(item.asset)

            const dataConnections = []
            // Add character to data connections
            dataConnections.push({ id: item.characterId })

            if (item.pose) dataConnections.push({ id: item.pose })
            if (item.expression) dataConnections.push({ id: item.expression })
            for (const eqId of item.equipmentIds) {
                dataConnections.push({ id: eqId })
            }

            // Ensure all data items exist before connecting
            const validConnections = []
            for (const conn of dataConnections) {
                const d = await prisma.data.findUnique({ where: { id: conn.id } })
                if (d) validConnections.push(conn)
            }

            await prisma.generation.create({
                data: {
                    id: item.id,
                    characterId: item.characterId, // Required FK
                    userPrompt: item.userPrompt,
                    imageId: asset.id,
                    data: {
                        create: validConnections.map(d => ({ data: { connect: { id: d.id } } }))
                    }
                }
            })
        }
      }
      console.log(`Checked/Imported looks`)
  }
}
