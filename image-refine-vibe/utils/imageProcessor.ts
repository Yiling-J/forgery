/**
 * Slices an image into a grid of smaller images.
 * @param imageSrc The source image data URL.
 * @param rows Number of rows.
 * @param cols Number of columns.
 * @returns A promise resolving to an array of data URLs for the segments.
 */
export const sliceImage = (
  imageSrc: string,
  rows: number = 3,
  cols: number = 3,
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const segments: string[] = []
      const segmentWidth = Math.floor(img.width / cols)
      const segmentHeight = Math.floor(img.height / rows)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      canvas.width = segmentWidth
      canvas.height = segmentHeight

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // Clear canvas for next segment
          ctx.clearRect(0, 0, segmentWidth, segmentHeight)

          // Draw the specific slice
          ctx.drawImage(
            img,
            x * segmentWidth,
            y * segmentHeight,
            segmentWidth,
            segmentHeight,
            0,
            0,
            segmentWidth,
            segmentHeight,
          )

          segments.push(canvas.toDataURL('image/png'))
        }
      }
      resolve(segments)
    }
    img.onerror = (err) => reject(err)
    img.src = imageSrc
  })
}

/**
 * Reads a file input as a Data URL.
 */
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
