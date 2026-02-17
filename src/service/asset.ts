import { prisma } from '../db'
import { fileService } from './file'

export class AssetService {
  async createAsset(file: File, meta: { name: string; type: string }) {
    const saved = await fileService.saveFile(file, meta.name)

    const asset = await prisma.asset.create({
      data: {
        name: meta.name,
        type: saved.mimeType,
        path: saved.filename,
      },
    })

    return asset
  }

  async createAssetFromBuffer(
    buffer: Buffer | ArrayBuffer,
    meta: { name: string; type: string; ext?: string },
  ) {
    const saved = await fileService.saveBuffer(buffer, meta.name, meta.type)

    const asset = await prisma.asset.create({
      data: {
        name: meta.name,
        type: saved.mimeType,
        path: saved.filename,
      },
    })

    return asset
  }

  // New method to handle already saved files
  async createAssetRecord(params: { path: string; name: string; type: string }) {
    return prisma.asset.create({
      data: {
        name: params.name,
        type: params.type,
        path: params.path,
      },
    })
  }

  async getAsset(id: string) {
    return prisma.asset.findUnique({
      where: { id },
    })
  }

  async deleteAsset(id: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
    })

    if (!asset) return

    // Delete file
    await fileService.deleteFile(asset.path)

    // Delete record
    await prisma.asset.delete({
      where: { id },
    })
  }
}

export const assetService = new AssetService()
