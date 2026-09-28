import type {
  PaginatedResult,
  Product,
  ProductFilters,
  ProductRepository,
  SortOption,
  PaginationParams,
} from "@/types"
import { createClient } from "@/lib/supabase/server"
import {
  mapProduct,
  type ProductCatalogRows,
} from "./supabase-catalog-mapper"

export const supabaseProductRepository: ProductRepository = {
  async list(filters, sort, pagination) {
    const products = await getActiveProducts()
    let filterCategoryId: string | undefined
    if (filters?.category) {
      const client = await createClient()
      const { data: category, error } = await client
        .from("categories")
        .select("id")
        .eq("slug", filters.category)
        .eq("is_active", true)
        .maybeSingle()
      if (error) throw error
      if (!category) return paginate([], pagination)
      filterCategoryId = category.id
    }
    let result = filterProducts(products, filters)
    if (filterCategoryId) {
      result = result.filter((product) =>
        product.categoryIds.includes(filterCategoryId!)
      )
    }
    result = sortProducts(result, sort)
    return paginate(result, pagination)
  },

  async getBySlug(slug) {
    const products = await getActiveProducts({ slug })
    return products[0] ?? null
  },

  async getById(id) {
    const products = await getActiveProducts({ id })
    return products[0] ?? null
  },

  async getFeatured(limit = 4) {
    const products = await getActiveProducts()
    return products.filter((product) => product.featured).slice(0, limit)
  },

  async getByCategory(categorySlug, pagination) {
    const client = await createClient()
    const { data: category, error: categoryError } = await client
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .maybeSingle()
    if (categoryError) throw categoryError
    if (!category) return paginate([], pagination)

    const products = await getActiveProducts()
    return paginate(
      products.filter((product) => product.categoryIds.includes(category.id)),
      pagination
    )
  },

  async search(query, pagination) {
    const products = await getActiveProducts()
    return paginate(filterProducts(products, { search: query }), pagination)
  },
}

async function getActiveProducts(match?: { id?: string; slug?: string }) {
  const client = await createClient()
  let query = client
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: true })
  if (match?.id) query = query.eq("id", match.id)
  if (match?.slug) query = query.eq("slug", match.slug)

  const { data: productRows, error } = await query
  if (error) throw error
  if (!productRows?.length) return []

  const ids = productRows.map((product) => product.id)
  const [variantsResult, imagesResult, categoriesResult] = await Promise.all([
    client.from("product_variants").select("*").in("product_id", ids),
    client
      .from("product_images")
      .select("*")
      .in("product_id", ids)
      .order("sort_order", { ascending: true }),
    client
      .from("product_categories")
      .select("product_id, category_id, sort_order")
      .in("product_id", ids)
      .order("sort_order", { ascending: true }),
  ])
  if (variantsResult.error) throw variantsResult.error
  if (imagesResult.error) throw imagesResult.error
  if (categoriesResult.error) throw categoriesResult.error

  const rows: ProductCatalogRows = {
    products: productRows,
    variants: variantsResult.data ?? [],
    images: imagesResult.data ?? [],
    productCategories: categoriesResult.data ?? [],
  }
  const imageUrl = (path: string) =>
    client.storage.from("product-images").getPublicUrl(path).data.publicUrl

  return rows.products.map((product) => mapProduct(product, rows, imageUrl))
}

function filterProducts(items: Product[], filters?: ProductFilters): Product[] {
  if (!filters) return items
  let result = items

  if (filters.priceRange) {
    const { min, max } = filters.priceRange
    result = result.filter((product) => {
      const price = product.variants[0]?.price ?? 0
      return (min === undefined || price >= min) && (max === undefined || price <= max)
    })
  }
  if (filters.inStock === true) {
    result = result.filter((product) =>
      product.variants.some(
        (variant) =>
          variant.inventory.quantity > 0 || variant.inventory.allowBackorder
      )
    )
  }
  if (filters.search) {
    const search = filters.search.toLowerCase()
    result = result.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.tags.some((tag) => tag.toLowerCase().includes(search))
    )
  }
  if (filters.tags?.length) {
    result = result.filter((product) =>
      filters.tags!.some((tag) => product.tags.includes(tag))
    )
  }
  return result
}

function sortProducts(items: Product[], sort?: SortOption): Product[] {
  if (!sort) return items
  return [...items].sort((a, b) => {
    let comparison = 0
    if (sort.field === "price") {
      comparison = (a.variants[0]?.price ?? 0) - (b.variants[0]?.price ?? 0)
    } else if (sort.field === "name") {
      comparison = a.name.localeCompare(b.name)
    } else if (sort.field === "createdAt") {
      comparison = Date.parse(a.createdAt) - Date.parse(b.createdAt)
    }
    return sort.order === "desc" ? -comparison : comparison
  })
}

function paginate<T>(items: T[], params?: PaginationParams): PaginatedResult<T> {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 12
  const total = items.length
  const totalPages = Math.ceil(total / limit)
  return {
    items: items.slice((page - 1) * limit, page * limit),
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}
