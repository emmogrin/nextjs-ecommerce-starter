"use client"

import { useEffect, useMemo, useState } from "react"
import { Heart } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ProductCard } from "@/components/products/product-card"
import { useWishlistStore } from "@/store/wishlist"
import type { Product } from "@/types"

export default function WishlistPage() {
  const wishlistItems = useWishlistStore((s) => s.items)
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retry, setRetry] = useState(0)
  const wishlistIds = useMemo(
    () => [...new Set(wishlistItems.map((item) => item.productId))],
    [wishlistItems]
  )
  const wishlistKey = wishlistIds.join(",")

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted || wishlistIds.length === 0) {
      setProducts([])
      setHasLoaded(wishlistIds.length === 0)
      setHasError(false)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    setHasLoaded(false)
    setIsLoading(true)
    setHasError(false)

    void fetch("/api/catalog/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: wishlistIds }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Wishlist products could not be loaded")
        const result = (await response.json()) as { products: Product[] }
        setProducts(result.products)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setProducts([])
        setHasError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
          setHasLoaded(true)
        }
      })

    return () => controller.abort()
  }, [mounted, wishlistKey, retry, wishlistIds])

  if (!mounted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <PageHeader title="Wishlist" />
      </div>
    )
  }

  if (wishlistIds.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <PageHeader title="Wishlist" />
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save products you love to find them easily later."
          actionLabel="Browse Products"
          actionHref="/shop"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        title="Wishlist"
        description={isLoading || !hasLoaded ? "Loading saved products…" : `${products.length} ${products.length === 1 ? "item" : "items"}`}
      />
      {hasError ? (
        <div className="mt-8 text-center" role="alert">
          <p className="text-sm text-muted-foreground">Your saved products could not be loaded. Please try again.</p>
          <button className="mt-3 text-sm font-medium underline underline-offset-4" onClick={() => setRetry((count) => count + 1)}>
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground" role="status">Loading saved products…</p>
      ) : hasLoaded && products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved products are currently available"
          description="Some products in your wishlist may no longer be available. Browse the current collection to find something new."
          actionLabel="Browse Products"
          actionHref="/shop"
        />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
