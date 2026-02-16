import { unlink } from 'node:fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { ulid } from 'ulidx'
// import { writeFile as bunWriteFile } from 'bun'

export class FileService {
  /**
   * Saves a file to the data/files directory.
   * If the file is an image, it converts it to WebP format.
   * @param file The file to save.
   * @param name Optional name for the file (used for extension detection if original name is missing).
   * @returns The relative path to the saved file.
   */
  async saveFile(
    file: File | Blob,
    name?: string,
  ): Promise<{ path: string; filename: string; mimeType: string }> {
    const id = ulid()
    let buffer: ArrayBuffer | Buffer
    let filename: string
    let mimeType: string

    if (file instanceof File) {
      buffer = await file.arrayBuffer()
      // Detect if it's an image based on type or extension
      if (file.type.startsWith('image/')) {
        const result = await this.optimizeImage(buffer)
        buffer = result.buffer
        filename = `${id}.webp`
        mimeType = 'image/webp'
      } else {
        // Fallback for non-images (though we mostly deal with images)
        const ext = name ? name.split('.').pop() : 'bin'
        filename = `${id}.${ext}`
        mimeType = file.type || 'application/octet-stream'
      }
    } else {
      // Blob case
      buffer = await file.arrayBuffer()
      if (file.type.startsWith('image/')) {
        const result = await this.optimizeImage(buffer)
        buffer = result.buffer
        filename = `${id}.webp`
        mimeType = 'image/webp'
      } else {
        const ext = name ? name.split('.').pop() : 'bin'
        filename = `${id}.${ext}`
        mimeType = file.type || 'application/octet-stream'
      }
    }

    const path = join('data/files', filename)
    // Bun.write is global
    await Bun.write(path, buffer)

    return { path, filename, mimeType }
  }

  /**
   * Saves a buffer directly as a file. Optimizes if it's an image.
   * @param buffer The buffer to save.
   * @param name Optional name for the file (used for extension detection).
   * @param mimeType Optional mimeType.
   */
  async saveBuffer(
    buffer: Buffer | ArrayBuffer,
    name?: string,
    mimeType?: string,
  ): Promise<{ path: string; filename: string; mimeType: string }> {
    const id = ulid()
    let finalBuffer: Buffer | ArrayBuffer = buffer
    let finalFilename: string
    let finalMimeType: string = mimeType || 'application/octet-stream'

    if (finalMimeType.startsWith('image/')) {
      try {
        const result = await this.optimizeImage(finalBuffer)
        finalBuffer = result.buffer
        finalFilename = `${id}.webp`
        finalMimeType = 'image/webp'
      } catch (error) {
        console.warn('Failed to optimize image buffer, saving as is.', error)
        const ext = name ? name.split('.').pop() : 'bin'
        finalFilename = `${id}.${ext}`
      }
    } else {
      const ext = name ? name.split('.').pop() : 'bin'
      finalFilename = `${id}.${ext}`
    }

    const path = join('data/files', finalFilename)
    await Bun.write(path, finalBuffer)
    return { path, filename: finalFilename, mimeType: finalMimeType }
  }

  /**
   * Optimizes an image buffer by converting it to WebP using sharp.
   */
  private async optimizeImage(buffer: ArrayBuffer | Buffer): Promise<{ buffer: Buffer }> {
    const optimizedBuffer = await sharp(buffer)
      .resize({
        width: 2048,
        height: 2048,
        fit: 'outside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer()

    return { buffer: optimizedBuffer }
  }

  /**
   * Saves a base64 string as an image file.
   */
  async saveBase64Image(base64: string): Promise<{ path: string; filename: string }> {
    // Strip prefix if present
    const data = base64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(data, 'base64')

    // Optimize
    const { buffer: optimized } = await this.optimizeImage(buffer)

    const id = ulid()
    const filename = `${id}.webp`
    const path = join('data/files', filename)

    await Bun.write(path, optimized)

    return { path, filename }
  }

  /**
   * Deletes a file from the data/files directory.
   */
  async deleteFile(filename: string): Promise<void> {
    const path = join('data/files', filename)
    try {
      // Check if file exists
      const file = Bun.file(path)
      if (await file.exists()) {
        await unlink(path)
      }
    } catch (error) {
      console.warn(`Failed to delete file: ${path}`, error)
      // We don't throw here to allow the database deletion to proceed
      // even if file deletion fails (e.g. file already gone)
    }
  }
}

export const fileService = new FileService()
