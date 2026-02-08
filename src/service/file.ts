import { join } from 'path'
import { ulid } from 'ulidx'
import sharp from 'sharp'
// import { writeFile as bunWriteFile } from 'bun'

export class FileService {
  /**
   * Saves a file to the data/files directory.
   * If the file is an image, it converts it to WebP format.
   * @param file The file to save.
   * @param name Optional name for the file (used for extension detection if original name is missing).
   * @returns The relative path to the saved file.
   */
  static async saveFile(file: File | Blob, name?: string): Promise<{ path: string; filename: string; mimeType: string }> {
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
       const result = await this.optimizeImage(buffer)
       buffer = result.buffer
       filename = `${id}.webp`
       mimeType = 'image/webp'
    }

    const path = join('data/files', filename)
    // Bun.write is global
    await Bun.write(path, buffer)

    return { path, filename, mimeType }
  }

  /**
   * Optimizes an image buffer by converting it to WebP using sharp.
   */
  private static async optimizeImage(buffer: ArrayBuffer | Buffer): Promise<{ buffer: Buffer }> {
    const optimizedBuffer = await sharp(buffer)
      .webp({ quality: 80 }) // Good balance between size and quality
      .toBuffer()

    return { buffer: optimizedBuffer }
  }

  /**
   * Saves a base64 string as an image file.
   */
  static async saveBase64Image(base64: string): Promise<{ path: string; filename: string }> {
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
}
