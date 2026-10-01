import "server-only"

import type { BlogArticle, BlogStatus } from "@/types"
import { createClient } from "@/lib/supabase/server"
import { mapBlogArticle, type BlogArticleRow } from "./supabase-blog-mapper"

export type BlogArticleInput = {
  title: string
  slug: string
  excerpt: string
  body: string
  author: string
  category?: string | null
  status: BlogStatus
  coverImageFile?: File
  coverImageAlt?: string
  removeCoverImage?: boolean
  publishedAt?: string | null
}

const bucketName = "product-images"
const coverImagePrefix = "blog/"
const coverImageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
}

async function requireAdminClient() {
  const client = await createClient()
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser()
  if (authError || !user) throw new Error("Authentication required")

  const { data: role, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()
  if (error) throw error
  if (role?.role !== "admin") throw new Error("Admin authorization required")
  return client
}

function publicImageUrl(
  client: Awaited<ReturnType<typeof createClient>>
): (path: string) => string {
  return (path) => client.storage.from(bucketName).getPublicUrl(path).data.publicUrl
}

function mapRow(
  row: unknown,
  client: Awaited<ReturnType<typeof createClient>>
): BlogArticle {
  return mapBlogArticle(row as BlogArticleRow, publicImageUrl(client))
}

function resolvePublishedAt(
  status: BlogStatus,
  previousPublishedAt: string | null,
  inputPublishedAt?: string | null
): string | null {
  if (status === "draft") return null
  if (inputPublishedAt) return inputPublishedAt
  if (previousPublishedAt) return previousPublishedAt
  return new Date().toISOString()
}

async function uploadCoverImage(
  client: Awaited<ReturnType<typeof createClient>>,
  articleId: string,
  file: File
): Promise<string> {
  const extension = coverImageTypes[file.type]
  if (!extension || file.size <= 0 || file.size > 10 * 1024 * 1024) {
    throw new Error("Choose a JPEG, PNG, WebP, or AVIF cover image up to 10 MB.")
  }
  const path = `${coverImagePrefix}${articleId}/${crypto.randomUUID()}.${extension}`
  const { error } = await client.storage.from(bucketName).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return path
}

async function removeManagedCoverImage(
  client: Awaited<ReturnType<typeof createClient>>,
  path: string | null
): Promise<void> {
  if (!path?.startsWith(coverImagePrefix)) return
  const { error } = await client.storage.from(bucketName).remove([path])
  if (error) {
    throw new Error("Article was saved, but the old cover image file could not be removed.")
  }
}

export const supabaseAdminBlogRepository = {
  async list(): Promise<BlogArticle[]> {
    const client = await requireAdminClient()
    const { data, error } = await client
      .from("blog_articles")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => mapRow(row, client))
  },

  async getById(id: string): Promise<BlogArticle | null> {
    const client = await requireAdminClient()
    const { data, error } = await client
      .from("blog_articles")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw error
    return data ? mapRow(data, client) : null
  },

  async create(input: BlogArticleInput): Promise<string> {
    const client = await requireAdminClient()
    const id = crypto.randomUUID()
    const publishedAt = resolvePublishedAt(input.status, null, input.publishedAt)

    const { error } = await client.from("blog_articles").insert({
      id,
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      body: input.body,
      author: input.author,
      category: input.category ?? null,
      cover_image_storage_path: null,
      cover_image_alt: input.coverImageAlt ?? "",
      status: input.status,
      published_at: publishedAt,
    })
    if (error) throw error

    if (input.coverImageFile) {
      try {
        const path = await uploadCoverImage(client, id, input.coverImageFile)
        const { error: updateError } = await client
          .from("blog_articles")
          .update({ cover_image_storage_path: path })
          .eq("id", id)
        if (updateError) {
          await client.storage.from(bucketName).remove([path])
          throw updateError
        }
      } catch (error) {
        await client.from("blog_articles").delete().eq("id", id)
        throw error
      }
    }

    return id
  },

  async update(id: string, input: BlogArticleInput): Promise<void> {
    const client = await requireAdminClient()
    const { data: current, error: readError } = await client
      .from("blog_articles")
      .select("published_at, cover_image_storage_path")
      .eq("id", id)
      .maybeSingle()
    if (readError) throw readError
    if (!current) throw new Error("Article not found.")

    const publishedAt = resolvePublishedAt(
      input.status,
      current.published_at,
      input.publishedAt
    )
    const { error } = await client
      .from("blog_articles")
      .update({
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        body: input.body,
        author: input.author,
        category: input.category ?? null,
        cover_image_alt: input.coverImageAlt ?? "",
        status: input.status,
        published_at: publishedAt,
      })
      .eq("id", id)
    if (error) throw error

    if (input.coverImageFile) {
      const path = await uploadCoverImage(client, id, input.coverImageFile)
      const { error: pathError } = await client
        .from("blog_articles")
        .update({ cover_image_storage_path: path })
        .eq("id", id)
      if (pathError) {
        await client.storage.from(bucketName).remove([path])
        throw pathError
      }
      await removeManagedCoverImage(client, current.cover_image_storage_path)
    } else if (input.removeCoverImage && current.cover_image_storage_path) {
      const { error: clearError } = await client
        .from("blog_articles")
        .update({ cover_image_storage_path: null })
        .eq("id", id)
      if (clearError) throw clearError
      await removeManagedCoverImage(client, current.cover_image_storage_path)
    }
  },

  async remove(id: string): Promise<void> {
    const client = await requireAdminClient()
    const { data: current, error: readError } = await client
      .from("blog_articles")
      .select("cover_image_storage_path")
      .eq("id", id)
      .maybeSingle()
    if (readError) throw readError

    const { error } = await client.from("blog_articles").delete().eq("id", id)
    if (error) throw error

    const path = current?.cover_image_storage_path
    if (path?.startsWith(coverImagePrefix)) {
      await client.storage.from(bucketName).remove([path])
    }
  },
}
