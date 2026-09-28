"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/products/star-rating"
import { formatPrice } from "@/lib/utils"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { useWishlistStore } from "@/store/wishlist"
import { toast } from "sonner"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
  featured?: boolean
}

export function ProductCard({ product, featured = false }: ProductCardProps) {
  const defaultVariant = product.variants[0]
  if (!defaultVariant) return null

  const price = defaultVariant.price
  const compareAtPrice = defaultVariant.compareAtPrice
  const isOnSale = compareAtPrice && compareAtPrice > price
  const image = product.images[0]
  const isPlaceholderImage = !image?.url || image.url === PLACEHOLDER_IMAGE

  const wishlistItems = useWishlistStore((s) => s.items)
  const addItem = useWishlistStore((s) => s.addItem)
  const removeItem = useWishlistStore((s) => s.removeItem)

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isWishlisted = mounted && wishlistItems.some((i) => i.productId === product.id)

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isWishlisted) {
      removeItem(product.id)
      toast("Removed from wishlist")
    } else {
      addItem({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price,
        image: image ?? { url: PLACEHOLDER_IMAGE, alt: product.name },
      })
      toast.success("Added to wishlist")
    }
  }

  return (
    <div className="group relative">
      <Link href={`/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f1ece5]">
          <Image
            src={image?.url ?? PLACEHOLDER_IMAGE}
            alt={isPlaceholderImage ? "" : product.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {isOnSale && (
            <Badge
              variant="secondary"
              className="absolute left-3 top-3 border border-[#e6ddd4] bg-white/95 text-xs text-[#42352d]"
            >
              Sale
            </Badge>
          )}
          {isPlaceholderImage && (
            <span aria-hidden="true" className="absolute bottom-3 left-3 rounded-full border border-white/70 bg-[#fbf7f1]/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#625448]">
              Illustration / Photo coming soon
            </span>
          )}
        </div>
        <div className="mt-3">
          <StarRating rating={product.rating} reviewCount={product.reviewCount} size="sm" />
          <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-medium leading-5 tracking-tight text-[#342a24] group-hover:underline sm:text-base">
            {product.name}
          </h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-medium text-[#42352d]">
              {formatPrice(price, defaultVariant.currency)}
            </span>
            {isOnSale && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(compareAtPrice, defaultVariant.currency)}
              </span>
            )}
          </div>
          {product.variants.length > 1 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {product.variants.length} options
            </p>
          )}
        </div>
      </Link>
      <button
        onClick={handleWishlist}
        className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/95 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${featured ? "" : "sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"}`}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={`h-4 w-4 ${isWishlisted ? "fill-current text-wishlist" : "text-[#625448]"}`}
        />
      </button>
    </div>
  )
}
