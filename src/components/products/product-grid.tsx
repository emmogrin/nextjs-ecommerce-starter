import type { Product } from "@/types"
import { ProductCard } from "./product-card"

interface ProductGridProps {
  products: Product[]
  featured?: boolean
}

export function ProductGrid({ products, featured = false }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${featured ? "gap-x-5 gap-y-10" : "gap-x-4 gap-y-8"}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} featured={featured} />
      ))}
    </div>
  )
}
