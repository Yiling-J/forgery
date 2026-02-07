export const writeFile = async (
  path: string,
  content: Blob | string | ArrayBuffer | ArrayBufferView,
) => {
  // @ts-expect-error - Bun.write accepts string path
  return Bun.write(path, content)
}
