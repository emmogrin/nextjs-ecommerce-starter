import Image from "next/image"
import Link from "next/link"
import { Package, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { formatPrice } from "@/lib/utils"
import { brandRepository, categoryRepository } from "@/lib/repositories"
import { supabaseAdminProductRepository } from "@/lib/repositories/supabase-admin-product-repository"

export default async function AdminProductsPage() {
  const [products, brands, categories] = await Promise.all([
    supabaseAdminProductRepository.list(),
    brandRepository.list(),
    categoryRepository.list(),
  ])
  const brandsById = new Map(brands.map((brand) => [brand.id, brand.name]))
  const categoriesById = new Map(
    categories.map((category) => [category.id, category.name])
  )

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${products.length} products in your catalog.`}
      >
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </PageHeader>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Products from your Supabase catalog will appear here."
        />
      ) : (
        <div className="mt-8 rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Categories</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const firstVariant = product.variants[0]
                const lowestPrice = product.variants.reduce(
                  (lowest, variant) => Math.min(lowest, variant.price),
                  firstVariant?.price ?? 0
                )
                const image =
                  product.images[0] ??
                  product.variants.flatMap((variant) => variant.images)[0]
                const productCategories = product.categoryIds
                  .map((categoryId) => categoriesById.get(categoryId))
                  .filter((name): name is string => Boolean(name))

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                          <Image
                            src={image?.url ?? PLACEHOLDER_IMAGE}
                            alt={image?.alt || product.name}
                            fill
                            unoptimized
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="font-medium hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === "active"
                            ? "default"
                            : product.status === "archived"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {firstVariant
                        ? `${product.variants.length > 1 ? "From " : ""}${formatPrice(lowestPrice, firstVariant.currency)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {brandsById.get(product.brandId) ?? "—"}
                    </TableCell>
                    <TableCell>
                      {productCategories.length > 0
                        ? productCategories.join(", ")
                        : "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
