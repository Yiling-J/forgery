import { ulid } from 'ulidx'
import { prisma } from '../db'
import { join, extname } from 'path'
import { writeFile } from '../lib/fileSystem'

export class AssetService {
  static async createAsset(file: File, meta: { name: string; type: string }) {
    const id = ulid()
    const ext = extname(file.name) || '.bin'
    const filename = `${id}${ext}`
    const path = join('data/files', filename)

    await writeFile(path, file)

    const asset = await prisma.asset.create({
      data: {
        id,
        name: meta.name,
        type: meta.type,
        path,
      },
    })

    return asset
  }

  static async getAsset(id: string) {
    return prisma.asset.findUnique({
      where: { id },
    })
  }
}
