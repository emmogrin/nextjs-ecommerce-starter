import { createClient } from "@/lib/supabase/server"
import { resolveImageUrl } from "./supabase-catalog-mapper"

export type AdminCategory = {
  id: string
  parentId: string | null
  parentName: string | null
  name: string
  slug: string
  description: string
  imageStoragePath: string | null
  imageUrl: string | null
  imageAlt: string
  sortOrder: number
  isActive: boolean
  productCount: number
}

export type AdminCategoryInput = {
  parentId: string | null
  name: string
  slug: string
  description: string
  imageAlt: string
  sortOrder: number
  isActive: boolean
  imageFile?: File
  removeImage?: boolean
}

type CategoryRow = {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string
  image_storage_path: string | null
  image_alt: string
  sort_order: number
  is_active: boolean
}

const bucketName = "product-images"
const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
}
const maxImageSize = 10 * 1024 * 1024

export const supabaseAdminCategoryRepository = {
  async list(): Promise<AdminCategory[]> {
    const client = await createClient()
    const { data: categories, error } = await client
      .from("categories")
      .select("id, parent_id, name, slug, description, image_storage_path, image_alt, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
    if (error) throw error

    const productLinks: { category_id: string }[] = []
    for (let offset = 0; ; offset += 1000) {
      const { data, error: linksError } = await client
        .from("product_categories")
        .select("category_id")
        .order("product_id", { ascending: true })
        .order("category_id", { ascending: true })
        .range(offset, offset + 999)
      if (linksError) throw linksError
      productLinks.push(...(data ?? []))
      if (!data || data.length < 1000) break
    }

    const rows = (categories ?? []) as CategoryRow[]
    const categoriesById = new Map(rows.map((category) => [category.id, category]))
    const counts = new Map<string, number>()
    for (const link of productLinks) {
      counts.set(link.category_id, (counts.get(link.category_id) ?? 0) + 1)
    }

    return rows.map((row) => mapAdminCategory(
      row,
      categoriesById.get(row.parent_id ?? "")?.name ?? null,
      counts.get(row.id) ?? 0,
      client
    ))
  },

  async getById(id: string): Promise<AdminCategory | null> {
    const client = await createClient()
    const { data, error } = await client
      .from("categories")
      .select("id, parent_id, name, slug, description, image_storage_path, image_alt, sort_order, is_active")
      .eq("id", id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null

    let parentName: string | null = null
    if (data.parent_id) {
      const { data: parent, error: parentError } = await client
        .from("categories")
        .select("name")
        .eq("id", data.parent_id)
        .maybeSingle()
      if (parentError) throw parentError
      parentName = parent?.name ?? null
    }
    return mapAdminCategory(data as CategoryRow, parentName, 0, client)
  },

  async create(input: AdminCategoryInput): Promise<string> {
    const client = await requireAdminClient()
    await validateParent(client, input.parentId)

    const id = `category-${crypto.randomUUID()}`
    const imageStoragePath = input.imageFile
      ? await uploadImage(client, id, input.imageFile)
      : null

    try {
      if (input.parentId === null && !imageStoragePath) {
        throw new Error("Top-level categories need a homepage cover image.")
      }
      const { error } = await client.from("categories").insert({
        id,
        parent_id: input.parentId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        image_storage_path: imageStoragePath,
        image_alt: input.imageAlt,
        sort_order: input.sortOrder,
        is_active: input.isActive,
      })
      if (error) throw error
      return id
    } catch (error) {
      await removeManagedImage(client, imageStoragePath)
      throw error
    }
  },

  async update(id: string, input: AdminCategoryInput): Promise<void> {
    const client = await requireAdminClient()
    const { data: current, error: readError } = await client
      .from("categories")
      .select("image_storage_path")
      .eq("id", id)
      .maybeSingle()
    if (readError) throw readError
    if (!current) throw new Error("Category not found.")

    await validateParent(client, input.parentId, id)

    const newImagePath = input.imageFile
      ? await uploadImage(client, id, input.imageFile)
      : null
    const nextImagePath = input.imageFile
      ? newImagePath
      : input.removeImage
        ? null
        : current.image_storage_path

    if (input.parentId === null && !nextImagePath) {
      await removeManagedImage(client, newImagePath)
      throw new Error("Top-level categories need a homepage cover image.")
    }

    const { data: updated, error: updateError } = await client
      .from("categories")
      .update({
        parent_id: input.parentId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        image_storage_path: nextImagePath,
        image_alt: input.imageAlt,
        sort_order: input.sortOrder,
        is_active: input.isActive,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle()

    if (updateError || !updated) {
      await removeManagedImage(client, newImagePath)
      if (updateError) throw updateError
      throw new Error("Category not found or the update was not authorized.")
    }

    if (newImagePath || input.removeImage) {
      await removeManagedImage(client, current.image_storage_path)
    }
  },
}

function mapAdminCategory(
  row: CategoryRow,
  parentName: string | null,
  productCount: number,
  client: Awaited<ReturnType<typeof createClient>>
): AdminCategory {
  return {
    id: row.id,
    parentId: row.parent_id,
    parentName,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageStoragePath: row.image_storage_path,
    imageUrl: row.image_storage_path
      ? resolveImageUrl(row.image_storage_path, (path) =>
          client.storage.from(bucketName).getPublicUrl(path).data.publicUrl
        )
      : null,
    imageAlt: row.image_alt,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    productCount,
  }
}

async function requireAdminClient() {
  const client = await createClient()
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) throw new Error("Please sign in to continue.")

  const { data: role, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()
  if (error || role?.role !== "admin") {
    throw new Error("You are not authorized to manage categories.")
  }
  return client
}

async function validateParent(
  client: Awaited<ReturnType<typeof createClient>>,
  parentId: string | null,
  categoryId?: string
) {
  if (!parentId) return
  if (parentId === categoryId) throw new Error("A category cannot be its own parent.")

  const { data, error } = await client
    .from("categories")
    .select("id, parent_id")
  if (error) throw error
  const parents = new Map((data ?? []).map((category) => [category.id, category.parent_id]))
  if (!parents.has(parentId)) throw new Error("Choose an existing parent category.")

  const visited = new Set<string>()
  let currentId: string | null = parentId
  while (currentId) {
    if (currentId === categoryId || visited.has(currentId)) {
      throw new Error("That parent would create a circular category hierarchy.")
    }
    visited.add(currentId)
    currentId = parents.get(currentId) ?? null
  }
}

async function uploadImage(
  client: Awaited<ReturnType<typeof createClient>>,
  categoryId: string,
  file: File
) {
  const extension = imageExtensions[file.type]
  if (!extension || file.size <= 0 || file.size > maxImageSize) {
    throw new Error("Choose a JPEG, PNG, WebP, or AVIF image up to 10 MB.")
  }
  const path = `categories/${categoryId}/${crypto.randomUUID()}.${extension}`
  const { error } = await client.storage.from(bucketName).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return path
}

async function removeManagedImage(
  client: Awaited<ReturnType<typeof createClient>>,
  path: string | null
) {
  if (!path?.startsWith("categories/")) return
  const { error } = await client.storage.from(bucketName).remove([path])
  if (error) throw new Error("Category was saved, but its old image could not be removed.")
}
