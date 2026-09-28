"use client"

import { useState } from "react"
import Image from "next/image"
import type { ProductImage } from "@/types"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface ProductGalleryProps {
  images: ProductImage[]
  productName?: string
}

export function ProductGallery({ images, productName = "Product" }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const currentImage = images[selectedIndex]
  const currentIsPlaceholder = !currentImage?.url || currentImage.url === PLACEHOLDER_IMAGE

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden bg-[#f1ece5]">
        <Image
          src={currentImage?.url ?? PLACEHOLDER_IMAGE}
          alt={currentIsPlaceholder ? "" : productName}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        {currentIsPlaceholder && (
          <span aria-hidden="true" className="absolute bottom-4 left-4 rounded-full border border-white/70 bg-[#fbf7f1]/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#625448]">
            Illustration / Photo coming soon
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative h-16 w-16 overflow-hidden border-2 bg-[#f1ece5] transition-colors",
                selectedIndex === index
                  ? "border-foreground"
                  : "border-transparent hover:border-neutral-300"
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image.url ?? PLACEHOLDER_IMAGE}
                alt={!image.url || image.url === PLACEHOLDER_IMAGE ? "" : `${productName} image ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
