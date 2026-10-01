import type {
  BlogArticle,
  BlogArticleRepository,
  PaginatedResult,
  PaginationParams,
} from "@/types"
import { createClient } from "@/lib/supabase/server"
import { mapBlogArticle, type BlogArticleRow } from "./supabase-blog-mapper"

const bucketName = "product-images"

function publicImageUrl(
  client: Awaited<ReturnType<typeof createClient>>
): (path: string) => string {
  return (path) => client.storage.from(bucketName).getPublicUrl(path).data.publicUrl
}

export const supabaseBlogRepository: BlogArticleRepository = {
  async list(params?: PaginationParams): Promise<PaginatedResult<BlogArticle>> {
    const client = await createClient()
    const page = Math.max(1, params?.page ?? 1)
    const limit = Math.min(100, Math.max(1, params?.limit ?? 9))
    const { data, error, count } = await client
      .from("blog_articles")
      .select("*", { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (error) throw error

    const imageUrl = publicImageUrl(client)
    const total = count ?? 0
    const totalPages = Math.ceil(total / limit)
    return {
      items: (data ?? []).map((row) =>
        mapBlogArticle(row as BlogArticleRow, imageUrl)
      ),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  },

  async getBySlug(slug: string): Promise<BlogArticle | null> {
    const client = await createClient()
    const { data, error } = await client
      .from("blog_articles")
      .select("*")
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle()
    if (error) throw error
    return data
      ? mapBlogArticle(data as unknown as BlogArticleRow, publicImageUrl(client))
      : null
  },

  async getById(id: string): Promise<BlogArticle | null> {
    const client = await createClient()
    const { data, error } = await client
      .from("blog_articles")
      .select("*")
      .eq("status", "published")
      .eq("id", id)
      .maybeSingle()
    if (error) throw error
    return data
      ? mapBlogArticle(data as unknown as BlogArticleRow, publicImageUrl(client))
      : null
  },
}
