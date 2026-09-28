import type { Product } from "@/types"
import { createClient } from "@/lib/supabase/server"
import {
  mapProduct,
  resolveImageUrl,
  type ProductCatalogRows,
} from "./supabase-catalog-mapper"

export type AdminProductInput = {
  name: string
  slug: string
  description: string
  brandId: string
  categoryIds: string[]
  status: Product["status"]
  variants: AdminProductVariantInput[]
  images?: { file: File; alt: string }[]
  removeImageIds?: string[]
}

export type AdminProductImage = {
  id: string
  storagePath: string
  url: string
  alt: string
  sortOrder: number
}

export type AdminProductVariantInput = {
  id?: string
  name: string
  sku: string
  options: { name: string; value: string }[]
  priceKobo: number
  compareAtPriceKobo: number | null
  quantity: number
}

/** Admin product reads and writes; writes are guarded here and by Supabase RLS. */
export const supabaseAdminProductRepository = {
  async list(): Promise<Product[]> {
    return loadProducts()
  },

  async getById(id: string): Promise<Product | null> {
    const products = await loadProducts(id)
    return products[0] ?? null
  },

  async create(input: AdminProductInput): Promise<string> {
    const client = await requireAdminClient()
    const { data: product, error } = await client
      .from("products")
      .insert({
        id: `prod-${crypto.randomUUID()}`,
        name: input.name,
        slug: input.slug,
        description: input.description,
        brand_id: input.brandId,
        status: input.status,
      })
      .select("id")
      .single()

    if (error) throw error

    if (input.categoryIds.length > 0) {
      const { error: categoriesError } = await client
        .from("product_categories")
        .insert(
          input.categoryIds.map((categoryId, sortOrder) => ({
            product_id: product.id,
            category_id: categoryId,
            sort_order: sortOrder,
          }))
        )

      if (categoriesError) {
        await client.from("products").delete().eq("id", product.id)
        throw categoriesError
      }
    }

    if (input.variants.length > 0) {
      const { error: variantsError } = await client
        .from("product_variants")
        .insert(input.variants.map((variant) => variantInsert(product.id, variant)))

      if (variantsError) {
        await client.from("products").delete().eq("id", product.id)
        throw variantsError
      }
    }

    try {
      await uploadProductImages(client, product.id, input.images ?? [])
    } catch (imageError) {
      await client.from("products").delete().eq("id", product.id)
      throw imageError
    }

    return product.id
  },

  async update(id: string, input: AdminProductInput): Promise<void> {
    const client = await requireAdminClient()
    const { data: product, error } = await client
      .from("products")
      .update({
        name: input.name,
        slug: input.slug,
        description: input.description,
        brand_id: input.brandId,
        status: input.status,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle()

    if (error) throw error
    if (!product) throw new Error("Product not found.")

    await syncProductCategories(client, id, input.categoryIds)
    await syncProductVariants(client, id, input.variants)
    await uploadProductImages(client, id, input.images ?? [])
    await removeProductImages(client, id, input.removeImageIds ?? [])
  },

  async listImages(productId: string): Promise<AdminProductImage[]> {
    const client = await createClient()
    const { data, error } = await client
      .from("product_images")
      .select("id, storage_path, alt, sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
    if (error) throw error
    return (data ?? []).map((image) => ({
      id: image.id,
      storagePath: image.storage_path,
      url: resolveImageUrl(image.storage_path, (path) =>
        client.storage.from("product-images").getPublicUrl(path).data.publicUrl
      ),
      alt: image.alt,
      sortOrder: image.sort_order,
    }))
  },
}

const allowedImageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
}

async function uploadProductImages(
  client: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  images: { file: File; alt: string }[]
) {
  if (images.length === 0) return
  const bucket = client.storage.from("product-images")
  const { data: lastImage, error: lastImageError } = await client
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lastImageError) throw lastImageError
  const firstSortOrder = (lastImage?.sort_order ?? -1) + 1
  const uploadedPaths: string[] = []
  const records = []

  try {
    for (const [index, image] of images.entries()) {
      const extension = allowedImageTypes[image.file.type]
      const path = `${productId}/${crypto.randomUUID()}.${extension}`
      const { error } = await bucket.upload(path, image.file, {
        contentType: image.file.type,
        upsert: false,
      })
      if (error) throw error
      uploadedPaths.push(path)
      records.push({
        id: `img-${crypto.randomUUID()}`,
        product_id: productId,
        variant_id: null,
        storage_path: path,
        alt: image.alt || image.file.name.replace(/\.[^.]+$/, ""),
        sort_order: firstSortOrder + index,
      })
    }

    const { error } = await client.from("product_images").insert(records)
    if (error) throw error
  } catch (error) {
    if (uploadedPaths.length > 0) await bucket.remove(uploadedPaths)
    throw error
  }
}

async function removeProductImages(
  client: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  imageIds: string[]
) {
  const uniqueIds = [...new Set(imageIds)]
  if (uniqueIds.length === 0) return

  const { data: images, error: readError } = await client
    .from("product_images")
    .select("id, storage_path")
    .eq("product_id", productId)
    .in("id", uniqueIds)
  if (readError) throw readError
  if ((images ?? []).length !== uniqueIds.length) {
    throw new Error("One or more selected images are unavailable.")
  }

  const { error: deleteError } = await client
    .from("product_images")
    .delete()
    .eq("product_id", productId)
    .in("id", uniqueIds)
  if (deleteError) throw deleteError

  const storagePaths = (images ?? [])
    .map((image) => image.storage_path)
    .filter((path) => !path.startsWith("demo-local/"))
  if (storagePaths.length > 0) {
    const { error } = await client.storage.from("product-images").remove(storagePaths)
    if (error) {
      throw new Error("Image records were removed, but some Storage files could not be deleted.")
    }
  }
}

function variantInsert(productId: string, variant: AdminProductVariantInput) {
  return {
    id: variant.id ?? `var-${crypto.randomUUID()}`,
    product_id: productId,
    name: variant.name,
    sku: variant.sku,
    options: variant.options,
    price_kobo: variant.priceKobo,
    compare_at_price_kobo: variant.compareAtPriceKobo,
    quantity: variant.quantity,
  }
}

async function syncProductVariants(
  client: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  variants: AdminProductVariantInput[]
) {
  const { data: existing, error: readError } = await client
    .from("product_variants")
    .select("id")
    .eq("product_id", productId)

  if (readError) throw new Error("Product details saved, but variants could not be loaded.")

  const existingIds = new Set((existing ?? []).map((variant) => variant.id))
  const submittedExistingIds = variants.flatMap((variant) =>
    variant.id ? [variant.id] : []
  )
  if (
    submittedExistingIds.length !== existingIds.size ||
    new Set(submittedExistingIds).size !== existingIds.size ||
    submittedExistingIds.some((variantId) => !existingIds.has(variantId))
  ) {
    throw new Error("The product variants changed. Reload the page and try again.")
  }

  const additions = variants.filter((variant) => !variant.id)
  if (additions.length > 0) {
    const { error } = await client
      .from("product_variants")
      .insert(additions.map((variant) => variantInsert(productId, variant)))
    if (error) throw error
  }

  for (const variant of variants) {
    if (!variant.id) continue
    const { error } = await client
      .from("product_variants")
      .update({
        name: variant.name,
        sku: variant.sku,
        options: variant.options,
        price_kobo: variant.priceKobo,
        compare_at_price_kobo: variant.compareAtPriceKobo,
        quantity: variant.quantity,
      })
      .eq("id", variant.id)
      .eq("product_id", productId)
    if (error) throw error
  }
}

async function loadProducts(productId?: string): Promise<Product[]> {
  const client = await createClient()
  let query = client.from("products").select("*").order("created_at", {
    ascending: false,
  })
  if (productId) query = query.eq("id", productId)
  const { data: products, error: productsError } = await query

  if (productsError) throw productsError
  if (!products?.length) return []

  const productIds = products.map((product) => product.id)
  const [variantsResult, imagesResult, productCategoriesResult] =
    await Promise.all([
      client.from("product_variants").select("*").in("product_id", productIds),
      client
        .from("product_images")
        .select("*")
        .in("product_id", productIds)
        .order("sort_order", { ascending: true }),
      client
        .from("product_categories")
        .select("product_id, category_id, sort_order")
        .in("product_id", productIds)
        .order("sort_order", { ascending: true }),
    ])

  if (variantsResult.error) throw variantsResult.error
  if (imagesResult.error) throw imagesResult.error
  if (productCategoriesResult.error) throw productCategoriesResult.error

  const rows: ProductCatalogRows = {
    products,
    variants: variantsResult.data ?? [],
    images: imagesResult.data ?? [],
    productCategories: productCategoriesResult.data ?? [],
  }
  const getPublicImageUrl = (path: string) =>
    client.storage.from("product-images").getPublicUrl(path).data.publicUrl

  return rows.products.map((product) =>
    mapProduct(product, rows, getPublicImageUrl)
  )
}

async function requireAdminClient() {
  const client = await createClient()
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) throw new Error("Please sign in to continue.")

  const { data: adminRole, error: roleError } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()

  if (roleError || adminRole?.role !== "admin") {
    throw new Error("You are not authorized to make product changes.")
  }

  return client
}

async function syncProductCategories(
  client: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  categoryIds: string[]
) {
  const { data: current, error: readError } = await client
    .from("product_categories")
    .select("category_id")
    .eq("product_id", productId)

  if (readError) {
    throw new Error("Product details saved, but categories could not be loaded.")
  }

  const currentIds = (current ?? []).map((row) => row.category_id)
  const newIds = categoryIds.filter(
    (categoryId) => !currentIds.includes(categoryId)
  )
  const removedIds = currentIds.filter(
    (categoryId) => !categoryIds.includes(categoryId)
  )

  if (newIds.length > 0) {
    const { error } = await client.from("product_categories").insert(
      newIds.map((categoryId) => ({
        product_id: productId,
        category_id: categoryId,
        sort_order: categoryIds.indexOf(categoryId),
      }))
    )
    if (error) {
      throw new Error(
        "Product details saved, but categories could not be updated."
      )
    }
  }

  if (removedIds.length > 0) {
    const { error } = await client
      .from("product_categories")
      .delete()
      .eq("product_id", productId)
      .in("category_id", removedIds)

    if (error) {
      if (newIds.length > 0) {
        await client
          .from("product_categories")
          .delete()
          .eq("product_id", productId)
          .in("category_id", newIds)
      }
      throw new Error(
        "Product details saved, but categories could not be updated."
      )
    }
  }
}
