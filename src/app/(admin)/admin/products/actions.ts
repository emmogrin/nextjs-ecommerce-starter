"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { supabaseAdminProductRepository } from "@/lib/repositories/supabase-admin-product-repository"

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
])

function readImages(formData: FormData) {
  const entries = formData.getAll("images")
  const files = entries.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  )
  if (files.length > 20) return { error: "Upload no more than 20 images at a time." as const }
  if (entries.some((entry) => typeof entry !== "string" && !(entry instanceof File))) {
    return { error: "One of the selected files is invalid." as const }
  }
  if (files.some((file) => !ALLOWED_IMAGE_TYPES.has(file.type))) {
    return { error: "Use JPEG, PNG, WebP, or AVIF image files." as const }
  }
  if (files.some((file) => file.size > MAX_IMAGE_SIZE)) {
    return { error: "Each image must be 10 MB or smaller." as const }
  }
  if (files.reduce((total, file) => total + file.size, 0) > MAX_IMAGE_SIZE) {
    return { error: "Keep the total image upload to 10 MB or less per save." as const }
  }
  const alt = String(formData.get("imageAlt") ?? "").trim()
  return { images: files.map((file) => ({ file, alt })) }
}

function readImageRemovals(formData: FormData) {
  const ids = formData.getAll("removeImageIds")
  if (ids.some((id) => typeof id !== "string" || !/^[A-Za-z0-9_-]+$/.test(id))) {
    return { error: "One of the selected images is invalid." as const }
  }
  return { ids: [...new Set(ids as string[])] }
}

export type ProductActionState = {
  error?: string
}

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Enter a valid lowercase slug."),
  description: z.string().trim(),
  brandId: z.string().min(1, "Select a brand."),
  categoryIds: z
    .array(z.string().min(1))
    .refine((ids) => new Set(ids).size === ids.length, "Invalid categories."),
  status: z.enum(["draft", "active", "archived"]),
  variants: z.array(z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Variant name is required."),
    sku: z.string().trim().min(1, "Variant SKU is required."),
    options: z.array(z.object({
      name: z.string().trim().min(1),
      value: z.string().trim().min(1),
    })),
    priceNgn: z.string().regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid NGN price."),
    compareAtPriceNgn: z.string().regex(/^$|^\d+(?:\.\d{1,2})?$/, "Enter a valid compare-at price."),
    quantity: z.number().int().nonnegative("Quantity must be zero or more."),
  })).min(1, "Add at least one variant."),
})

function toKobo(value: string) {
  if (!value) return null
  const [naira, kobo = ""] = value.split(".")
  const amount = Number(naira) * 100 + Number(kobo.padEnd(2, "0"))
  return Number.isSafeInteger(amount) ? amount : null
}

function toRepositoryInput(input: z.infer<typeof productFormSchema>) {
  return {
    ...input,
    variants: input.variants.map((variant) => {
      const priceKobo = toKobo(variant.priceNgn)
      const compareAtPriceKobo = toKobo(variant.compareAtPriceNgn)
      if (priceKobo === null) throw new Error("Variant price is too large.")
      if (variant.compareAtPriceNgn && compareAtPriceKobo === null) {
        throw new Error("Compare-at price is too large.")
      }
      if (compareAtPriceKobo !== null && compareAtPriceKobo < priceKobo) {
        throw new Error("Compare-at price must be at least the price.")
      }
      return {
        id: variant.id || undefined,
        name: variant.name,
        sku: variant.sku,
        options: variant.options,
        priceKobo,
        compareAtPriceKobo,
        quantity: variant.quantity,
      }
    }),
  }
}

function parseProductForm(formData: FormData) {
  let variants: unknown
  try {
    variants = JSON.parse(String(formData.get("variants") ?? ""))
  } catch {
    variants = null
  }

  return productFormSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    brandId: formData.get("brandId"),
    categoryIds: formData.getAll("categoryIds"),
    status: formData.get("status"),
    variants,
  })
}

function getSaveError(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code)
    if (code === "23505") return "That product slug or variant SKU is already in use."
    if (code === "23503") return "The selected brand or category is unavailable."
    if (code === "42501") return "You are not authorized to make product changes."
  }

  return error instanceof Error
    ? error.message
    : "The product could not be saved. Please try again."
}

export async function createProductAction(
  _previousState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const images = readImages(formData)
  if ("error" in images) return { error: images.error }
  const parsed = parseProductForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the product fields." }
  }

  try {
    await supabaseAdminProductRepository.create({
      ...toRepositoryInput(parsed.data),
      images: images.images,
    })
  } catch (error) {
    return { error: getSaveError(error) }
  }

  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function updateProductAction(
  productId: string,
  _previousState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const images = readImages(formData)
  if ("error" in images) return { error: images.error }
  const removals = readImageRemovals(formData)
  if ("error" in removals) return { error: removals.error }
  const parsed = parseProductForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the product fields." }
  }

  try {
    await supabaseAdminProductRepository.update(productId, {
      ...toRepositoryInput(parsed.data),
      images: images.images,
      removeImageIds: removals.ids,
    })
  } catch (error) {
    return { error: getSaveError(error) }
  }

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${productId}/edit`)
  redirect("/admin/products")
}
