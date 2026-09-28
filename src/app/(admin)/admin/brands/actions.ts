"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  supabaseAdminBrandRepository,
  type AdminBrandInput,
} from "@/lib/repositories/supabase-admin-brand-repository"

export type BrandActionState = { error?: string }

const brandSchema = z.object({
  name: z.string().trim().min(1, "Brand name is required."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Enter a valid lowercase slug."),
  description: z.string().trim(),
  isActive: z.boolean(),
})

function parseBrand(formData: FormData) {
  return brandSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    isActive: formData.get("isActive") === "on",
  })
}

function parseLogo(formData: FormData) {
  const entry = formData.get("logo")
  if (!(entry instanceof File) || entry.size === 0) {
    return { logoFile: undefined, error: undefined }
  }
  if (!new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]).has(entry.type)) {
    return { error: "Use a JPEG, PNG, WebP, or AVIF logo." }
  }
  if (entry.size > 10 * 1024 * 1024) {
    return { error: "Logo must be 10 MB or smaller." }
  }
  return { logoFile: entry, error: undefined }
}

function getBrandError(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code)
    if (code === "23505") return "That brand slug is already in use."
    if (code === "42501") return "You are not authorized to manage brands."
  }
  return error instanceof Error
    ? error.message
    : "The brand could not be saved. Please try again."
}

function inputFromForm(
  parsed: z.infer<typeof brandSchema>,
  formData: FormData,
  logoFile?: File
): AdminBrandInput {
  return {
    ...parsed,
    logoFile,
    removeLogo: formData.get("removeLogo") === "on",
  }
}

export async function createBrandAction(
  _previousState: BrandActionState,
  formData: FormData
): Promise<BrandActionState> {
  const parsed = parseBrand(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the brand fields." }
  const logo = parseLogo(formData)
  if (logo.error) return { error: logo.error }

  try {
    await supabaseAdminBrandRepository.create(inputFromForm(parsed.data, formData, logo.logoFile))
  } catch (error) {
    return { error: getBrandError(error) }
  }

  revalidatePath("/admin/brands")
  revalidatePath("/brands")
  redirect("/admin/brands")
}

export async function updateBrandAction(
  brandId: string,
  _previousState: BrandActionState,
  formData: FormData
): Promise<BrandActionState> {
  const parsed = parseBrand(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the brand fields." }
  const logo = parseLogo(formData)
  if (logo.error) return { error: logo.error }

  try {
    await supabaseAdminBrandRepository.update(
      brandId,
      inputFromForm(parsed.data, formData, logo.logoFile)
    )
  } catch (error) {
    return { error: getBrandError(error) }
  }

  revalidatePath("/admin/brands")
  revalidatePath(`/admin/brands/${brandId}/edit`)
  revalidatePath("/brands")
  redirect("/admin/brands")
}
