import fs from 'node:fs'
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
  subCategory: string | null
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
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir)
    }
    if (!fs.existsSync(this.assetsDir)) {
      fs.mkdirSync(this.assetsDir)
    }
  }

  async export() {
    this.ensureDirs()

    // 1. Characters
    const characters = await prisma.character.findMany({ include: { image: true } })
    const characterData: CharacterData[] = characters.map((c) => {
      this.copyAsset(c.image.path)
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        asset: {
          name: c.image.name,
          type: c.image.type,
          path: c.image.path,
        },
      }
    })
    fs.writeFileSync(join(this.baseDir, 'characters.json'), JSON.stringify(characterData, null, 2))

    // 2. Equipments
    const equipments = await prisma.equipment.findMany({ include: { image: true } })
    const equipmentData: EquipmentData[] = equipments.map((e) => {
      this.copyAsset(e.image.path)
      return {
        id: e.id,
        name: e.name,
        description: e.description,
        category: e.category,
        subCategory: e.subCategory,
        asset: {
          name: e.image.name,
          type: e.image.type,
          path: e.image.path,
        },
      }
    })
    fs.writeFileSync(join(this.baseDir, 'equipments.json'), JSON.stringify(equipmentData, null, 2))

    // 3. Poses
    const poses = await prisma.pose.findMany({ include: { image: true } })
    const poseData: PoseData[] = poses.map((p) => {
      this.copyAsset(p.image.path)
      return {
        id: p.id,
        name: p.name,
        asset: {
          name: p.image.name,
          type: p.image.type,
          path: p.image.path,
        },
      }
    })
    fs.writeFileSync(join(this.baseDir, 'poses.json'), JSON.stringify(poseData, null, 2))

    // 4. Expressions
    const expressions = await prisma.expression.findMany({ include: { image: true } })
    const expressionData: ExpressionData[] = expressions.map((e) => {
      this.copyAsset(e.image.path)
      return {
        id: e.id,
        name: e.name,
        asset: {
          name: e.image.name,
          type: e.image.type,
          path: e.image.path,
        },
      }
    })
    fs.writeFileSync(join(this.baseDir, 'expressions.json'), JSON.stringify(expressionData, null, 2))

    // 5. Generations (Looks)
    const generations = await prisma.generation.findMany({
      include: {
        image: true,
        equipments: true,
      },
    })
    const generationData: GenerationData[] = generations.map((g) => {
      this.copyAsset(g.image.path)
      return {
        id: g.id,
        characterId: g.characterId,
        userPrompt: g.userPrompt,
        pose: g.pose,
        expression: g.expression,
        asset: {
          name: g.image.name,
          type: g.image.type,
          path: g.image.path,
        },
        equipmentIds: g.equipments.map((e) => e.equipmentId),
      }
    })
    fs.writeFileSync(join(this.baseDir, 'looks.json'), JSON.stringify(generationData, null, 2))

    console.log(`Exported ${characters.length} characters`)
    console.log(`Exported ${equipments.length} equipments`)
    console.log(`Exported ${poses.length} poses`)
    console.log(`Exported ${expressions.length} expressions`)
    console.log(`Exported ${generations.length} looks`)
  }

  async import() {
    if (!fs.existsSync(this.baseDir)) {
      console.log('No example data found, skipping import.')
      return
    }

    // 1. Characters
    if (fs.existsSync(join(this.baseDir, 'characters.json'))) {
      const data: CharacterData[] = JSON.parse(
        fs.readFileSync(join(this.baseDir, 'characters.json'), 'utf-8'),
      )
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
    if (fs.existsSync(join(this.baseDir, 'equipments.json'))) {
      const data: EquipmentData[] = JSON.parse(
        fs.readFileSync(join(this.baseDir, 'equipments.json'), 'utf-8'),
      )
      for (const item of data) {
        const asset = await this.createAssetFromExample(item.asset)
        await prisma.equipment.create({
          data: {
            id: item.id,
            name: item.name,
            description: item.description,
            category: item.category,
            subCategory: item.subCategory,
            imageId: asset.id,
          },
        })
      }
      console.log(`Imported ${data.length} equipments`)
    }

    // 3. Poses
    if (fs.existsSync(join(this.baseDir, 'poses.json'))) {
      const data: PoseData[] = JSON.parse(
        fs.readFileSync(join(this.baseDir, 'poses.json'), 'utf-8'),
      )
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
    if (fs.existsSync(join(this.baseDir, 'expressions.json'))) {
      const data: ExpressionData[] = JSON.parse(
        fs.readFileSync(join(this.baseDir, 'expressions.json'), 'utf-8'),
      )
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
    if (fs.existsSync(join(this.baseDir, 'looks.json'))) {
      const data: GenerationData[] = JSON.parse(
        fs.readFileSync(join(this.baseDir, 'looks.json'), 'utf-8'),
      )
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
            pose: item.pose,
            expression: item.expression,
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

  private copyAsset(filename: string) {
    const src = join('data/files', filename)
    const dest = join(this.assetsDir, filename)
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest)
    } else {
      console.warn(`Asset file not found: ${src}`)
    }
  }

  private async createAssetFromExample(assetData: AssetData) {
    const filePath = join(this.assetsDir, assetData.path)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Example asset file not found: ${filePath}`)
    }
    const buffer = fs.readFileSync(filePath)
    // We use createAssetFromBuffer which handles saving to data/files and DB creation
    return assetService.createAssetFromBuffer(buffer, {
      name: assetData.name,
      type: assetData.type,
    })
  }
}

export const exampleDataService = new ExampleDataService()
