"use client"

import Image from "next/image"
import Link from "next/link"
import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { slugify } from "@/lib/utils"
import type { AdminCategory } from "@/lib/repositories/supabase-admin-category-repository"
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryActionState,
} from "./actions"

type ParentCategoryOption = Pick<AdminCategory, "id" | "name">

export function CategoryForm({
  category,
  parentCategories,
}: {
  category?: AdminCategory
  parentCategories: ParentCategoryOption[]
}) {
  const action = category
    ? updateCategoryAction.bind(null, category.id)
    : createCategoryAction
  const [state, formAction, isPending] = useActionState<CategoryActionState, FormData>(
    action,
    {}
  )
  const [name, setName] = useState(category?.name ?? "")
  const [slug, setSlug] = useState(category?.slug ?? "")
  const [slugEdited, setSlugEdited] = useState(false)
  const [parentId, setParentId] = useState(category?.parentId ?? "")
  const [removeImage, setRemoveImage] = useState(false)
  const isTopLevel = parentId === ""
  const imageIsRequired = isTopLevel && !category?.imageUrl && !removeImage

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

      <div className="rounded-md border bg-muted/30 p-4 text-sm">
        <p className="font-medium">How category placement works</p>
        <p className="mt-1 text-muted-foreground">
          Top-level categories appear on the homepage and need a cover image. Child categories appear under their parent.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          name="name"
          value={name}
          onChange={(event) => {
            const nextName = event.target.value
            setName(nextName)
            if (!slugEdited) setSlug(slugify(nextName))
          }}
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-slug">Slug</Label>
        <Input
          id="category-slug"
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value)
            setSlugEdited(true)
          }}
          autoComplete="off"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
        />
        <p className="text-xs text-muted-foreground">
          Generated from the name; you can edit it using lowercase letters, numbers, and single hyphens.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-description">Description</Label>
        <Textarea
          id="category-description"
          name="description"
          defaultValue={category?.description ?? ""}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-parent">Parent category</Label>
        <select
          id="category-parent"
          name="parentId"
          value={parentId}
          onChange={(event) => {
            setParentId(event.target.value)
            if (!event.target.value) setRemoveImage(false)
          }}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Top-level category</option>
          {parentCategories.map((parent) => (
            <option key={parent.id} value={parent.id}>{parent.name}</option>
          ))}
        </select>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Category image</h2>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, or AVIF; up to 10 MB. Top-level categories use this image on the homepage.
          </p>
        </div>

        {category?.imageUrl && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative h-24 w-20 overflow-hidden rounded-md border bg-muted">
              <Image
                src={category.imageUrl}
                alt={category.imageAlt || category.name}
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm">Current category image</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="removeImage"
                  checked={removeImage}
                  disabled={isTopLevel}
                  onChange={(event) => setRemoveImage(event.target.checked)}
                  className="h-4 w-4 rounded border-input accent-foreground"
                />
                Remove current image
              </label>
              {isTopLevel && (
                <p className="text-xs text-muted-foreground">
                  Choose a parent category before removing this image.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="category-image">Upload or replace image</Label>
          <Input
            id="category-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            required={imageIsRequired}
          />
          {category?.imageUrl && (
            <p className="text-xs text-muted-foreground">
              Uploading a new image replaces the current image.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-image-alt">Image alt text</Label>
          <Input
            id="category-image-alt"
            name="imageAlt"
            defaultValue={category?.imageAlt ?? ""}
            autoComplete="off"
          />
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="category-sort-order">Sort order</Label>
        <Input
          id="category-sort-order"
          name="sortOrder"
          type="number"
          step="1"
          defaultValue={category?.sortOrder ?? 0}
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={category?.isActive ?? true}
          className="h-4 w-4 rounded border-input accent-foreground"
        />
        Active (available in the storefront and product forms)
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : category ? "Save changes" : "Create category"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/categories">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
