import type { BlogArticle, ProductImage } from "@/types"
import { resolveImageUrl } from "./supabase-catalog-mapper"

export type BlogArticleRow = {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  author: string
  category: string | null
  cover_image_storage_path: string | null
  cover_image_alt: string
  status: BlogArticle["status"]
  published_at: string | null
  created_at: string
  updated_at: string
}

export type BlogPublicImageUrl = (storagePath: string) => string

export function mapBlogArticle(
  row: BlogArticleRow,
  getPublicImageUrl: BlogPublicImageUrl
): BlogArticle {
  const coverImage: ProductImage | undefined = row.cover_image_storage_path
    ? {
        url: resolveImageUrl(row.cover_image_storage_path, getPublicImageUrl),
        alt: row.cover_image_alt,
      }
    : undefined

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body: row.body,
    author: row.author,
    category: row.category,
    ...(coverImage ? { coverImage } : {}),
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
