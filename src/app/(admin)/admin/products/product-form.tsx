"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Brand, Category, Product } from "@/types"
import type { AdminProductImage } from "@/lib/repositories/supabase-admin-product-repository"
import { ProductImageFields } from "./product-image-fields"
import { ProductVariantFields } from "./product-variant-fields"
import {
  createProductAction,
  updateProductAction,
  type ProductActionState,
} from "./actions"

interface ProductFormProps {
  brands: Brand[]
  categories: Category[]
  product?: Product
  images?: AdminProductImage[]
}

export function ProductForm({ brands, categories, product, images = [] }: ProductFormProps) {
  const action = product
    ? updateProductAction.bind(null, product.id)
    : createProductAction
  const [state, formAction, isPending] = useActionState<
    ProductActionState,
    FormData
  >(action, {})

  return (
    <form action={formAction} className="mt-8 max-w-3xl space-y-6">
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="product-name">Product name</Label>
        <Input
          id="product-name"
          name="name"
          defaultValue={product?.name ?? ""}
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-slug">Slug</Label>
        <Input
          id="product-slug"
          name="slug"
          defaultValue={product?.slug ?? ""}
          autoComplete="off"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
        />
        <p className="text-xs text-muted-foreground">
          Use lowercase letters, numbers, and single hyphens.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-description">Description</Label>
        <Textarea
          id="product-description"
          name="description"
          defaultValue={product?.description ?? ""}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-brand">Brand</Label>
        <select
          id="product-brand"
          name="brandId"
          defaultValue={product?.brandId ?? ""}
          required
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>
            Select a brand
          </option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Categories</legend>
        <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2 text-sm font-normal"
            >
              <input
                type="checkbox"
                name="categoryIds"
                value={category.id}
                defaultChecked={product?.categoryIds.includes(category.id)}
                className="h-4 w-4 rounded border-input accent-foreground"
              />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="product-status">Status</Label>
        <select
          id="product-status"
          name="status"
          defaultValue={product?.status ?? "draft"}
          required
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <ProductVariantFields variants={product?.variants ?? []} />

      <ProductImageFields images={images} />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending || brands.length === 0}>
          {isPending ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>

      {brands.length === 0 && (
        <p className="text-sm text-destructive">
          Add an active brand before creating a product.
        </p>
      )}
    </form>
  )
}
