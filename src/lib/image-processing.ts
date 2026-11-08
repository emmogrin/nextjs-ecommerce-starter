const WEBP_QUALITY = 0.86

/** Resize and encode an image in the browser, retaining the original on failure. */
export async function optimizeImageForUpload(
  file: File,
  maxDimension: number
): Promise<File> {
  if (!file.type.startsWith("image/")) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.type === "image/webp") {
      bitmap.close()
      return file
    }

    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext("2d")
    if (!context) {
      bitmap.close()
      return file
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
    )
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image"
    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    })
  } catch {
    return file
  }
}

/** Process a small group of selected files without creating unbounded canvas work. */
export async function optimizeImagesForUpload(
  files: File[],
  maxDimension: number,
  onProgress: (completed: number) => void
): Promise<File[]> {
  const optimized = new Array<File>(files.length)
  let nextIndex = 0
  let completed = 0

  const workers = Array.from(
    { length: Math.min(3, files.length) },
    async () => {
      while (nextIndex < files.length) {
        const index = nextIndex++
        optimized[index] = await optimizeImageForUpload(files[index], maxDimension)
        onProgress(++completed)
      }
    }
  )

  await Promise.all(workers)
  return optimized
}
