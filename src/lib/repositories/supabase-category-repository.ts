import type { Category, CategoryRepository } from "@/types"
import { createClient } from "@/lib/supabase/server"
import { mapCategory } from "./supabase-catalog-mapper"

export const supabaseCategoryRepository: CategoryRepository = {
  async list() {
    const client = await createClient()
    const { data, error } = await client
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    if (error) throw error
    return (data ?? []).map((row) =>
      mapCategory(row, (path) =>
        client.storage.from("product-images").getPublicUrl(path).data.publicUrl
      )
    )
  },

  async getBySlug(slug) {
    return getCategory({ slug })
  },

  async getById(id) {
    return getCategory({ id })
  },

  async getChildren(parentId) {
    const client = await createClient()
    const { data, error } = await client
      .from("categories")
      .select("*")
      .eq("parent_id", parentId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    if (error) throw error
    return (data ?? []).map((row) =>
      mapCategory(row, (path) =>
        client.storage.from("product-images").getPublicUrl(path).data.publicUrl
      )
    )
  },

  async getTopLevel() {
    const client = await createClient()
    const { data, error } = await client
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    if (error) throw error
    return (data ?? []).map((row) =>
      mapCategory(row, (path) =>
        client.storage.from("product-images").getPublicUrl(path).data.publicUrl
      )
    )
  },

  async getAncestors(categoryId) {
    const chain: Category[] = []
    let current = await getCategory({ id: categoryId })
    while (current) {
      chain.unshift(current)
      current = current.parentId ? await getCategory({ id: current.parentId }) : null
    }
    return chain
  },
}

async function getCategory(match: { id?: string; slug?: string }) {
  const client = await createClient()
  let query = client
    .from("categories")
    .select("*")
    .eq("is_active", true)
  if (match.id) query = query.eq("id", match.id)
  if (match.slug) query = query.eq("slug", match.slug)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
    ? mapCategory(data, (path) =>
        client.storage.from("product-images").getPublicUrl(path).data.publicUrl
      )
    : null
}
