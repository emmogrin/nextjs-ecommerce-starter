"use client"

import Image from "next/image"
import Link from "next/link"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AdminBrand } from "@/lib/repositories/supabase-admin-brand-repository"
import {
  createBrandAction,
  updateBrandAction,
  type BrandActionState,
} from "./actions"

export function BrandForm({ brand }: { brand?: AdminBrand }) {
  const action = brand
    ? updateBrandAction.bind(null, brand.id)
    : createBrandAction
  const [state, formAction, isPending] = useActionState<BrandActionState, FormData>(
    action,
    {}
  )

  return (
    <form action={formAction} className="mt-8 max-w-3xl space-y-6">
      {state.error && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="brand-name">Brand name</Label>
        <Input id="brand-name" name="name" defaultValue={brand?.name ?? ""} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand-slug">Slug</Label>
        <Input
          id="brand-slug"
          name="slug"
          defaultValue={brand?.slug ?? ""}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          autoComplete="off"
          required
        />
        <p className="text-xs text-muted-foreground">Use lowercase letters, numbers, and single hyphens.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand-description">Description</Label>
        <Textarea id="brand-description" name="description" defaultValue={brand?.description ?? ""} rows={4} />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Brand logo</h2>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or AVIF; up to 10 MB.</p>
        </div>
        {brand?.logoUrl && (
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted">
              <Image src={brand.logoUrl} alt={`${brand.name} logo`} fill unoptimized sizes="80px" className="object-contain" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="removeLogo" className="h-4 w-4 rounded border-input accent-foreground" />
              Remove current logo
            </label>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="brand-logo">Upload or replace logo</Label>
          <Input id="brand-logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp,image/avif" />
        </div>
      </section>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={brand?.isActive ?? true} className="h-4 w-4 rounded border-input accent-foreground" />
        Active (visible in the storefront)
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : brand ? "Save changes" : "Create brand"}
        </Button>
        <Button variant="outline" asChild><Link href="/admin/brands">Cancel</Link></Button>
      </div>
    </form>
  )
}
