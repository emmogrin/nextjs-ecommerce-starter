"use client"

import Link from "next/link"
import { useActionState, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Brand, Category, Product } from "@/types"
import type { AdminProductImage } from "@/lib/repositories/supabase-admin-product-repository"
import { optimizeImagesForUpload } from "@/lib/image-processing"
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

  const submitInFlight = useRef(false)
  const [processing, setProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState({ completed: 0, total: 0 })
  const [imageError, setImageError] = useState("")

  useEffect(() => {
    if (isPending) submitInFlight.current = false
  }, [isPending])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitInFlight.current || isPending || processing) return
    submitInFlight.current = true
    setImageError("")

    const form = event.currentTarget
    const formData = new FormData(form)
    const selectedFiles = formData.getAll("images").filter(
      (entry): entry is File => entry instanceof File && entry.size > 0
    )

    if (selectedFiles.length === 0) {
      formAction(formData)
      return
    }

    setProcessing(true)
    setProcessingProgress({ completed: 0, total: selectedFiles.length })
    try {
      const optimizedFiles = await optimizeImagesForUpload(
        selectedFiles,
        1600,
        (completed) => setProcessingProgress({ completed, total: selectedFiles.length })
      )
      if (optimizedFiles.reduce((total, file) => total + file.size, 0) > 10 * 1024 * 1024) {
        setImageError("The optimized images still exceed 10 MB total. Remove an image or choose smaller files, then retry.")
        submitInFlight.current = false
        return
      }
      formData.delete("images")
      optimizedFiles.forEach((file) => formData.append("images", file, file.name))
      formAction(formData)
    } catch {
      setImageError("Images could not be prepared in this browser. Please retry or choose different files.")
      submitInFlight.current = false
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-3xl space-y-6">
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}
      {imageError && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {imageError}
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

      {processing && (
        <div role="status" aria-live="polite" className="space-y-2 text-sm text-muted-foreground">
          <p>Preparing images: {processingProgress.completed} of {processingProgress.total}</p>
          <progress className="h-2 w-full accent-foreground" max={processingProgress.total} value={processingProgress.completed} />
        </div>
      )}
      {isPending && (
        <div role="status" aria-live="polite" className="space-y-2 text-sm text-muted-foreground">
          <p>Uploading images and saving product. Keep this page open.</p>
          <progress className="h-2 w-full accent-foreground" aria-label="Uploading images and saving product" />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending || processing || brands.length === 0}>
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
