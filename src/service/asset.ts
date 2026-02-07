import { ulid } from 'ulidx'
import { prisma } from '../db'
import { join, extname } from 'path'
// import { writeFile } from '../lib/fileSystem' // Using Bun.write

export class AssetService {
  static async createAsset(file: File, meta: { name: string; type: string }) {
    const id = ulid()
    const ext = extname(file.name) || '.bin'
    const filename = `${id}${ext}`
    const path = join('data/files', filename)

    // await writeFile(path, file)
    await Bun.write(path, await file.arrayBuffer())

    const asset = await prisma.asset.create({
      data: {
        id,
        name: meta.name,
        type: meta.type,
        path: filename, // Save only filename or relative path
      },
    })

    return asset
  }

  // New method to handle already saved files
  static async createAssetRecord(params: { path: string; name: string; type: string }) {
    const id = ulid()
    return prisma.asset.create({
      data: {
        id,
        name: params.name,
        type: params.type,
        path: params.path,
      },
    })
  }

  static async getAsset(id: string) {
    return prisma.asset.findUnique({
      where: { id },
    })
  }
}
