import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '../db'
import { assetService } from './asset'

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

interface GenerationData {
  id: string
  characterId: string
  userPrompt: string | null
  pose: string | null
  expression: string | null
  asset: AssetData
  equipmentIds: string[]
}

export class ExampleDataService {
  private baseDir = 'example-data'
  private assetsDir = join(this.baseDir, 'assets')

  constructor() {
    // ensure base directories exist on instantiation (or method call)
  }

  private ensureDirs() {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir)
    }
    if (!existsSync(this.assetsDir)) {
      mkdirSync(this.assetsDir)
    }
  }

  async export() {
    this.ensureDirs()

    // 1. Characters
    const characters = await prisma.character.findMany({ include: { image: true } })
    const characterData: CharacterData[] = []
    for (const c of characters) {
      await this.copyAsset(c.image.path)
      characterData.push({
        id: c.id,
        name: c.name,
        description: c.description,
        asset: {
          name: c.image.name,
          type: c.image.type,
          path: c.image.path,
        },
      })
    }
    await Bun.write(join(this.baseDir, 'characters.json'), JSON.stringify(characterData, null, 2))

    // 2. Equipments
    const equipments = await prisma.equipment.findMany({ include: { image: true } })
    const equipmentData: EquipmentData[] = []
    for (const e of equipments) {
      await this.copyAsset(e.image.path)
      equipmentData.push({
        id: e.id,
        name: e.name,
        description: e.description,
        category: e.category,
        asset: {
          name: e.image.name,
          type: e.image.type,
          path: e.image.path,
        },
      })
    }
    await Bun.write(join(this.baseDir, 'equipments.json'), JSON.stringify(equipmentData, null, 2))

    // 3. Poses
    const poses = await prisma.pose.findMany({ include: { image: true } })
    const poseData: PoseData[] = []
    for (const p of poses) {
      await this.copyAsset(p.image.path)
      poseData.push({
        id: p.id,
        name: p.name,
        asset: {
          name: p.image.name,
          type: p.image.type,
          path: p.image.path,
        },
      })
    }
    await Bun.write(join(this.baseDir, 'poses.json'), JSON.stringify(poseData, null, 2))

    // 4. Expressions
    const expressions = await prisma.expression.findMany({ include: { image: true } })
    const expressionData: ExpressionData[] = []
    for (const e of expressions) {
      await this.copyAsset(e.image.path)
      expressionData.push({
        id: e.id,
        name: e.name,
        asset: {
          name: e.image.name,
          type: e.image.type,
          path: e.image.path,
        },
      })
    }
    await Bun.write(join(this.baseDir, 'expressions.json'), JSON.stringify(expressionData, null, 2))

    // 5. Generations (Looks)
    const generations = await prisma.generation.findMany({
      include: {
        image: true,
        equipments: true,
      },
    })
    const generationData: GenerationData[] = []
    for (const g of generations) {
      await this.copyAsset(g.image.path)
      generationData.push({
        id: g.id,
        characterId: g.characterId,
        userPrompt: g.userPrompt,
        pose: g.poseId,
        expression: g.expressionId,
        asset: {
          name: g.image.name,
          type: g.image.type,
          path: g.image.path,
        },
        equipmentIds: g.equipments.map((e) => e.equipmentId),
      })
    }
    await Bun.write(join(this.baseDir, 'looks.json'), JSON.stringify(generationData, null, 2))

    console.log(`Exported ${characters.length} characters`)
    console.log(`Exported ${equipments.length} equipments`)
    console.log(`Exported ${poses.length} poses`)
    console.log(`Exported ${expressions.length} expressions`)
    console.log(`Exported ${generations.length} looks`)
  }

  async import() {
    if (!existsSync(this.baseDir)) {
      console.log('No example data found, skipping import.')
      return
    }

    // 1. Characters
    const charFile = Bun.file(join(this.baseDir, 'characters.json'))
    if (await charFile.exists()) {
      const data: CharacterData[] = await charFile.json()
      for (const item of data) {
        const asset = await this.createAssetFromExample(item.asset)
        await prisma.character.create({
          data: {
            id: item.id,
            name: item.name,
            description: item.description,
            imageId: asset.id,
          },
        })
      }
      console.log(`Imported ${data.length} characters`)
    }

    // 2. Equipments
    const equipFile = Bun.file(join(this.baseDir, 'equipments.json'))
    if (await equipFile.exists()) {
      const data: EquipmentData[] = await equipFile.json()
      for (const item of data) {
        const asset = await this.createAssetFromExample(item.asset)
        await prisma.equipment.create({
          data: {
            id: item.id,
            name: item.name,
            description: item.description,
            category: item.category,
            imageId: asset.id,
          },
        })
      }
      console.log(`Imported ${data.length} equipments`)
    }

    // 3. Poses
    const poseFile = Bun.file(join(this.baseDir, 'poses.json'))
    if (await poseFile.exists()) {
      const data: PoseData[] = await poseFile.json()
      for (const item of data) {
        const asset = await this.createAssetFromExample(item.asset)
        await prisma.pose.create({
          data: {
            id: item.id,
            name: item.name,
            imageId: asset.id,
          },
        })
      }
      console.log(`Imported ${data.length} poses`)
    }

    // 4. Expressions
    const exprFile = Bun.file(join(this.baseDir, 'expressions.json'))
    if (await exprFile.exists()) {
      const data: ExpressionData[] = await exprFile.json()
      for (const item of data) {
        const asset = await this.createAssetFromExample(item.asset)
        await prisma.expression.create({
          data: {
            id: item.id,
            name: item.name,
            imageId: asset.id,
          },
        })
      }
      console.log(`Imported ${data.length} expressions`)
    }

    // 5. Generations (Looks)
    const lookFile = Bun.file(join(this.baseDir, 'looks.json'))
    if (await lookFile.exists()) {
      const data: GenerationData[] = await lookFile.json()
      for (const item of data) {
        // Ensure character exists
        const characterExists = await prisma.character.findUnique({
          where: { id: item.characterId },
        })
        if (!characterExists) {
          console.warn(`Skipping look ${item.id}: Character ${item.characterId} not found`)
          continue
        }

        const asset = await this.createAssetFromExample(item.asset)
        await prisma.generation.create({
          data: {
            id: item.id,
            characterId: item.characterId,
            userPrompt: item.userPrompt,
            poseId: item.pose,
            expressionId: item.expression,
            imageId: asset.id,
            equipments: {
              create: item.equipmentIds.map((id) => ({
                equipment: { connect: { id } },
              })),
            },
          },
        })
      }
      console.log(`Imported ${data.length} looks`)
    }
  }

  private async copyAsset(filename: string) {
    const src = join('data/files', filename)
    const dest = join(this.assetsDir, filename)
    const file = Bun.file(src)
    if (await file.exists()) {
      await Bun.write(dest, file)
    } else {
      console.warn(`Asset file not found: ${src}`)
    }
  }

  private async createAssetFromExample(assetData: AssetData) {
    const filePath = join(this.assetsDir, assetData.path)
    const file = Bun.file(filePath)
    if (!(await file.exists())) {
      throw new Error(`Example asset file not found: ${filePath}`)
    }
    const buffer = await file.arrayBuffer()
    // We use createAssetFromBuffer which handles saving to data/files and DB creation
    return assetService.createAssetFromBuffer(buffer, {
      name: assetData.name,
      type: assetData.type,
    })
  }
}

export const exampleDataService = new ExampleDataService()
