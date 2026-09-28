import { createClient } from "@/lib/supabase/server"
import { resolveImageUrl } from "./supabase-catalog-mapper"

export type AdminBrand = {
  id: string
  name: string
  slug: string
  description: string
  logoStoragePath: string | null
  logoUrl: string | null
  isActive: boolean
  productCount?: number
}

export type AdminBrandInput = {
  name: string
  slug: string
  description: string
  isActive: boolean
  logoFile?: File
  removeLogo?: boolean
}

const bucketName = "product-images"
const logoTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
}

export const supabaseAdminBrandRepository = {
  async list(): Promise<AdminBrand[]> {
    const client = await createClient()
    const { data: brands, error } = await client
      .from("brands")
      .select("id, name, slug, description, logo_storage_path, is_active")
      .order("name", { ascending: true })
    if (error) throw error

    const { data: products, error: productsError } = await client
      .from("products")
      .select("brand_id")
    if (productsError) throw productsError

    const counts = new Map<string, number>()
    for (const product of products ?? []) {
      counts.set(product.brand_id, (counts.get(product.brand_id) ?? 0) + 1)
    }

    return (brands ?? []).map((brand) => ({
      ...mapAdminBrand(brand, client),
      productCount: counts.get(brand.id) ?? 0,
    }))
  },

  async getById(id: string): Promise<AdminBrand | null> {
    const client = await createClient()
    const { data, error } = await client
      .from("brands")
      .select("id, name, slug, description, logo_storage_path, is_active")
      .eq("id", id)
      .maybeSingle()
    if (error) throw error
    return data ? mapAdminBrand(data, client) : null
  },

  async create(input: AdminBrandInput): Promise<string> {
    const client = await requireAdminClient()
    const id = `brand-${crypto.randomUUID()}`
    const { error } = await client.from("brands").insert({
      id,
      name: input.name,
      slug: input.slug,
      description: input.description,
      is_active: input.isActive,
    })
    if (error) throw error

    if (input.logoFile) {
      try {
        const path = await uploadLogo(client, id, input.logoFile)
        const { error: updateError } = await client
          .from("brands")
          .update({ logo_storage_path: path })
          .eq("id", id)
        if (updateError) {
          await client.storage.from(bucketName).remove([path])
          throw updateError
        }
      } catch (error) {
        await client.from("brands").delete().eq("id", id)
        throw error
      }
    }

    return id
  },

  async update(id: string, input: AdminBrandInput): Promise<void> {
    const client = await requireAdminClient()
    const { data: current, error: readError } = await client
      .from("brands")
      .select("logo_storage_path")
      .eq("id", id)
      .maybeSingle()
    if (readError) throw readError
    if (!current) throw new Error("Brand not found.")

    const { error: updateError } = await client
      .from("brands")
      .update({
        name: input.name,
        slug: input.slug,
        description: input.description,
        is_active: input.isActive,
      })
      .eq("id", id)
    if (updateError) throw updateError

    if (input.logoFile) {
      const path = await uploadLogo(client, id, input.logoFile)
      const { error } = await client
        .from("brands")
        .update({ logo_storage_path: path })
        .eq("id", id)
      if (error) {
        await client.storage.from(bucketName).remove([path])
        throw error
      }
      await removeManagedLogo(client, current.logo_storage_path)
    } else if (input.removeLogo && current.logo_storage_path) {
      const { error } = await client
        .from("brands")
        .update({ logo_storage_path: null })
        .eq("id", id)
      if (error) throw error
      await removeManagedLogo(client, current.logo_storage_path)
    }
  },
}

function mapAdminBrand(
  row: {
    id: string
    name: string
    slug: string
    description: string
    logo_storage_path: string | null
    is_active: boolean
  },
  client: Awaited<ReturnType<typeof createClient>>
): AdminBrand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoStoragePath: row.logo_storage_path,
    logoUrl: row.logo_storage_path
      ? resolveImageUrl(row.logo_storage_path, (path) =>
          client.storage.from(bucketName).getPublicUrl(path).data.publicUrl
        )
      : null,
    isActive: row.is_active,
  }
}

async function requireAdminClient() {
  const client = await createClient()
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()
  if (userError || !user) throw new Error("Please sign in to continue.")

  const { data: role, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()
  if (error || role?.role !== "admin") {
    throw new Error("You are not authorized to manage brands.")
  }
  return client
}

async function uploadLogo(
  client: Awaited<ReturnType<typeof createClient>>,
  brandId: string,
  file: File
) {
  const extension = logoTypes[file.type]
  if (!extension || file.size <= 0 || file.size > 10 * 1024 * 1024) {
    throw new Error("Choose a JPEG, PNG, WebP, or AVIF logo up to 10 MB.")
  }
  const path = `brands/${brandId}/${crypto.randomUUID()}.${extension}`
  const { error } = await client.storage.from(bucketName).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return path
}

async function removeManagedLogo(
  client: Awaited<ReturnType<typeof createClient>>,
  path: string | null
) {
  if (!path?.startsWith("brands/")) return
  const { error } = await client.storage.from(bucketName).remove([path])
  if (error) throw new Error("Brand was saved, but its old logo file could not be removed.")
}
