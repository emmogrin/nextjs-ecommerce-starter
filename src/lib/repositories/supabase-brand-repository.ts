import type { BrandRepository } from "@/types"
import { createClient } from "@/lib/supabase/server"
import { mapBrand } from "./supabase-catalog-mapper"

export const supabaseBrandRepository: BrandRepository = {
  async list() {
    const client = await createClient()
    const { data, error } = await client
      .from("brands")
      .select("id, name, slug, description")
      .eq("is_active", true)
      .order("id", { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapBrand)
  },

  async getBySlug(slug) {
    return getBrand({ slug })
  },

  async getById(id) {
    return getBrand({ id })
  },
}

async function getBrand(match: { id?: string; slug?: string }) {
  const client = await createClient()
  let query = client
    .from("brands")
    .select("id, name, slug, description")
    .eq("is_active", true)
  if (match.id) query = query.eq("id", match.id)
  if (match.slug) query = query.eq("slug", match.slug)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data ? mapBrand(data) : null
}
