"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  supabaseAdminBlogRepository,
  type BlogArticleInput,
} from "@/lib/repositories/supabase-admin-blog-repository"

export type BlogActionState = { error?: string }

const blogArticleSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Enter a valid lowercase slug."),
  excerpt: z.string().trim(),
  body: z.string().trim().min(1, "Article body is required."),
  author: z.string().trim().min(1, "Author is required."),
  category: z.string().trim().optional(),
  coverImageAlt: z
    .string()
    .trim()
    .max(500, "Alt text must be 500 characters or fewer."),
  status: z.enum(["draft", "published"]),
})

function parseForm(formData: FormData) {
  return blogArticleSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    author: formData.get("author"),
    category: formData.get("category") || undefined,
    coverImageAlt: formData.get("coverImageAlt") ?? "",
    status: formData.get("status"),
  })
}

function parseCoverImage(formData: FormData) {
  const entry = formData.get("coverImage")
  if (!(entry instanceof File) || entry.size === 0) {
    return { file: undefined }
  }
  if (
    !new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]).has(
      entry.type
    )
  ) {
    return { error: "Use a JPEG, PNG, WebP, or AVIF cover image." }
  }
  if (entry.size > 10 * 1024 * 1024) {
    return { error: "Cover image must be 10 MB or smaller." }
  }
  return { file: entry }
}

function toInput(
  parsed: z.infer<typeof blogArticleSchema>,
  formData: FormData,
  coverImageFile?: File
): BlogArticleInput {
  return {
    ...parsed,
    category: parsed.category || null,
    coverImageFile,
    removeCoverImage: formData.get("removeCoverImage") === "on",
  }
}

function getSaveError(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code)
    if (code === "23505") return "That article slug is already in use."
    if (code === "42501") return "You are not authorized to manage blog articles."
  }
  return error instanceof Error
    ? error.message
    : "The article could not be saved. Please try again."
}

export async function createArticleAction(
  _previousState: BlogActionState,
  formData: FormData
): Promise<BlogActionState> {
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the article fields." }
  }
  const cover = parseCoverImage(formData)
  if ("error" in cover) return { error: cover.error }

  try {
    await supabaseAdminBlogRepository.create(toInput(parsed.data, formData, cover.file))
  } catch (error) {
    return { error: getSaveError(error) }
  }

  revalidatePath("/admin/blog")
  redirect("/admin/blog")
}

export async function updateArticleAction(
  articleId: string,
  _previousState: BlogActionState,
  formData: FormData
): Promise<BlogActionState> {
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the article fields." }
  }
  const cover = parseCoverImage(formData)
  if ("error" in cover) return { error: cover.error }

  try {
    await supabaseAdminBlogRepository.update(
      articleId,
      toInput(parsed.data, formData, cover.file)
    )
  } catch (error) {
    return { error: getSaveError(error) }
  }

  revalidatePath("/admin/blog")
  revalidatePath(`/admin/blog/${articleId}/edit`)
  redirect("/admin/blog")
}

export async function deleteArticleAction(articleId: string) {
  try {
    await supabaseAdminBlogRepository.remove(articleId)
  } catch {
    redirect("/admin/blog?error=delete")
  }

  revalidatePath("/admin/blog")
  redirect("/admin/blog")
}
