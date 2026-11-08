"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AdminProductImage } from "@/lib/repositories/supabase-admin-product-repository"

const maxFileSize = 10 * 1024 * 1024
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
])

export function ProductImageFields({
  images,
}: {
  images: AdminProductImage[]
}) {
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState("")

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 20) {
      setFileError("Choose no more than 20 images at a time.")
      event.target.value = ""
      setSelectedFiles([])
      return
    }
    if (files.some((file) => !allowedTypes.has(file.type))) {
      setFileError("Use JPEG, PNG, WebP, or AVIF image files.")
      event.target.value = ""
      setSelectedFiles([])
      return
    }
    if (files.some((file) => file.size > maxFileSize)) {
      setFileError("Each image must be 10 MB or smaller.")
      event.target.value = ""
      setSelectedFiles([])
      return
    }
    setFileError("")
    setSelectedFiles(files)
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-medium">Product images</h2>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP, or AVIF; up to 10 MB each and 20 images per save. Images are optimized before upload.
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => {
            const markedForRemoval = removedIds.includes(image.id)
            return (
              <div key={image.id} className="space-y-2 rounded-md border p-2">
                <div className="relative aspect-square overflow-hidden rounded bg-muted">
                  <Image
                    src={image.url}
                    alt={image.alt || "Product image"}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className={`object-cover ${markedForRemoval ? "opacity-40" : ""}`}
                  />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {image.alt || image.storagePath}
                </p>
                <input type="hidden" name="removeImageIds" value={markedForRemoval ? image.id : ""} disabled={!markedForRemoval} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRemovedIds((current) =>
                      markedForRemoval
                        ? current.filter((id) => id !== image.id)
                        : [...current, image.id]
                    )
                  }
                >
                  {markedForRemoval ? "Keep image" : "Remove image"}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="product-images-upload">Upload images</Label>
        <Input
          id="product-images-upload"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={handleFileChange}
        />
        {fileError && <p role="alert" className="text-sm text-destructive">{fileError}</p>}
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {selectedFiles.map((file, index) => (
              <SelectedImagePreview key={`${file.name}-${index}`} file={file} />
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-image-alt">Alt text for uploaded images (optional)</Label>
            <Input id="product-image-alt" name="imageAlt" maxLength={500} />
          </div>
        </div>
      )}
    </section>
  )
}

function SelectedImagePreview({ file }: { file: File }) {
  const [previewUrl] = useState(() => URL.createObjectURL(file))
  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl])

  return (
    <div className="space-y-1">
      <div className="relative aspect-square overflow-hidden rounded-md border bg-muted">
        <Image src={previewUrl} alt={file.name} fill unoptimized className="object-cover" />
      </div>
      <p className="truncate text-xs text-muted-foreground">{file.name}</p>
    </div>
  )
}
