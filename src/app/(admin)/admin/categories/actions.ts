"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  supabaseAdminCategoryRepository,
  type AdminCategoryInput,
} from "@/lib/repositories/supabase-admin-category-repository"

export type CategoryActionState = { error?: string }

const categorySchema = z.object({
  parentId: z.string(),
  name: z.string().trim().min(1, "Category name is required."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Enter a valid lowercase slug."),
  description: z.string().trim(),
  imageAlt: z.string().trim(),
  sortOrder: z.coerce.number().int("Sort order must be a whole number."),
  isActive: z.boolean(),
})

function parseCategory(formData: FormData) {
  return categorySchema.safeParse({
    parentId: formData.get("parentId") ?? "",
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    imageAlt: formData.get("imageAlt") ?? "",
    sortOrder: formData.get("sortOrder") ?? "0",
    isActive: formData.get("isActive") === "on",
  })
}

function parseImage(formData: FormData) {
  const entry = formData.get("image")
  if (!(entry instanceof File) || entry.size === 0) {
    return { imageFile: undefined, error: undefined }
  }
  if (!new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]).has(entry.type)) {
    return { error: "Use a JPEG, PNG, WebP, or AVIF category image." }
  }
  if (entry.size > 10 * 1024 * 1024) {
    return { error: "Category images must be 10 MB or smaller." }
  }
  return { imageFile: entry, error: undefined }
}

function getCategoryError(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code)
    if (code === "23505") return "That category slug is already in use."
    if (code === "23503") return "Choose an existing parent category."
    if (code === "42501") return "You are not authorized to manage categories."
  }
  return error instanceof Error
    ? error.message
    : "The category could not be saved. Please try again."
}

function inputFromForm(
  parsed: z.infer<typeof categorySchema>,
  formData: FormData,
  imageFile?: File
): AdminCategoryInput {
  return {
    ...parsed,
    parentId: parsed.parentId || null,
    imageFile,
    removeImage: formData.get("removeImage") === "on",
  }
}

function revalidateCategoryPages(id?: string) {
  revalidatePath("/")
  revalidatePath("/[slug]", "page")
  revalidatePath("/shop")
  revalidatePath("/admin/categories")
  revalidatePath("/admin/categories/new")
  revalidatePath("/admin/categories/[id]/edit", "page")
  revalidatePath("/admin/products/new")
  revalidatePath("/admin/products/[id]/edit", "page")
  if (id) revalidatePath(`/admin/categories/${id}/edit`)
}

export async function createCategoryAction(
  _previousState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const parsed = parseCategory(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the category fields." }
  }
  const image = parseImage(formData)
  if (image.error) return { error: image.error }

  let id: string
  try {
    id = await supabaseAdminCategoryRepository.create(
      inputFromForm(parsed.data, formData, image.imageFile)
    )
  } catch (error) {
    return { error: getCategoryError(error) }
  }

  revalidateCategoryPages(id)
  redirect("/admin/categories")
}

export async function updateCategoryAction(
  categoryId: string,
  _previousState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const parsed = parseCategory(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the category fields." }
  }
  const image = parseImage(formData)
  if (image.error) return { error: image.error }

  try {
    await supabaseAdminCategoryRepository.update(
      categoryId,
      inputFromForm(parsed.data, formData, image.imageFile)
    )
  } catch (error) {
    return { error: getCategoryError(error) }
  }

  revalidateCategoryPages(categoryId)
  redirect("/admin/categories")
}
