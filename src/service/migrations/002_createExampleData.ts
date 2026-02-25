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

  // 1. Characters
  const charFile = Bun.file(join(baseDir, 'characters.json'))
  if (await charFile.exists()) {
      const data: CharacterData[] = await charFile.json()
      for (const item of data) {
         const exists = await prisma.character.findUnique({ where: { id: item.id } })
         if (!exists) {
            const asset = await createAssetFromExample(item.asset)
            await prisma.character.create({
            data: {
                id: item.id,
                name: item.name,
                description: item.description,
                imageId: asset.id,
            },
            })
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
            if (item.pose) dataConnections.push({ id: item.pose })
            if (item.expression) dataConnections.push({ id: item.expression })
            for (const eqId of item.equipmentIds) {
                dataConnections.push({ id: eqId })
            }

            await prisma.generation.create({
                data: {
                    id: item.id,
                    characterId: item.characterId,
                    userPrompt: item.userPrompt,
                    imageId: asset.id,
                    data: {
                        create: dataConnections.map(d => ({ data: { connect: { id: d.id } } }))
                    }
                }
            })
        }
      }
      console.log(`Checked/Imported looks`)
  }
}
