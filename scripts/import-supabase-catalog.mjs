import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import { loadEnvConfig } from "@next/env"

const root = process.cwd()
const sourcePath = fileURLToPath(
  new URL("../src/data/products.json", import.meta.url)
)
const applyChanges = process.argv.includes("--apply")

loadEnvConfig(root)

const catalog = JSON.parse(await readFile(sourcePath, "utf8"))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertUnique(values, description) {
  assert(
    new Set(values).size === values.length,
    `Source contains duplicate ${description}.`
  )
}

function validateCatalog(data) {
  assert(Array.isArray(data.brands), "Source is missing brands.")
  assert(Array.isArray(data.categories), "Source is missing categories.")
  assert(Array.isArray(data.products), "Source is missing products.")
  assert(data.brands.length === 6, `Expected 6 brands; found ${data.brands.length}.`)
  assert(data.categories.filter((category) => !category.parentId).length === 5,
    "Expected 5 top-level categories.")
  assert(data.categories.filter((category) => category.parentId).length === 3,
    "Expected 3 subcategories.")
  assert(data.products.length === 14, `Expected 14 products; found ${data.products.length}.`)

  assertUnique(data.brands.map((brand) => brand.id), "brand IDs")
  assertUnique(data.categories.map((category) => category.id), "category IDs")
  assertUnique(data.products.map((product) => product.id), "product IDs")
  assertUnique(data.products.map((product) => product.slug), "product slugs")

  const brandIds = new Set(data.brands.map((brand) => brand.id))
  const categoryIds = new Set(data.categories.map((category) => category.id))
  const variantIds = []
  const skus = []
  let variantCount = 0
  let categoryLinkCount = 0
  let imageCount = 0

  for (const category of data.categories) {
    assert(!category.parentId || categoryIds.has(category.parentId),
      `Category ${category.id} references missing parent ${category.parentId}.`)
  }

  for (const product of data.products) {
    assert(brandIds.has(product.brandId),
      `Product ${product.id} references missing brand ${product.brandId}.`)
    assert(Array.isArray(product.categoryIds), `Product ${product.id} is missing categoryIds.`)
    assert(Array.isArray(product.variants), `Product ${product.id} is missing variants.`)
    assert(Array.isArray(product.images), `Product ${product.id} is missing images.`)
    for (const categoryId of product.categoryIds) {
      assert(categoryIds.has(categoryId),
        `Product ${product.id} references missing category ${categoryId}.`)
      categoryLinkCount++
    }
    for (const variant of product.variants) {
      assert(variant.productId === product.id,
        `Variant ${variant.id} has a mismatched productId.`)
      assert(Number.isSafeInteger(variant.price) && variant.price >= 0,
        `Variant ${variant.id} has an invalid price.`)
      assert(variant.currency === "NGN",
        `Variant ${variant.id} is not priced in NGN; refusing to import.`)
      assert(
        variant.compareAtPrice === undefined ||
          (Number.isSafeInteger(variant.compareAtPrice) &&
            variant.compareAtPrice >= variant.price),
        `Variant ${variant.id} has an invalid compareAtPrice.`
      )
      assert(Number.isInteger(variant.inventory?.quantity) && variant.inventory.quantity >= 0,
        `Variant ${variant.id} has an invalid inventory quantity.`)
      variantIds.push(variant.id)
      skus.push(variant.sku)
      variantCount++
    }
    imageCount += product.images.length
  }

  assert(variantCount === 28, `Expected 28 variants; found ${variantCount}.`)
  assertUnique(variantIds, "variant IDs")
  assertUnique(skus, "variant SKUs")

  return { brands: data.brands.length, categories: data.categories.length,
    products: data.products.length, variants: variantCount,
    productCategories: categoryLinkCount, productImages: imageCount }
}

const counts = validateCatalog(catalog)

if (!applyChanges) {
  console.log("Dry run only. No Supabase requests were made.")
  console.log(JSON.stringify(counts, null, 2))
  console.log("Pass --apply to upsert these records into the configured project.")
  process.exit(0)
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
assert(supabaseUrl, "Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL before applying.")
assert(adminKey, "Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY before applying.")
assert(!adminKey.startsWith("sb_publishable_"),
  "A publishable/anon key cannot seed this catalog; use a server-side Supabase secret key.")

const supabase = createClient(supabaseUrl, adminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

async function upsert(table, rows, onConflict = "id") {
  if (rows.length === 0) return
  const { error } = await supabase.from(table).upsert(rows, { onConflict })
  if (error) throw new Error(`Upsert into ${table} failed: ${error.message}`)
}

const brandRows = catalog.brands.map((brand) => ({
  id: brand.id,
  name: brand.name,
  slug: brand.slug,
  description: brand.description,
  is_active: true,
}))

const topLevelCategoryRows = catalog.categories
  .filter((category) => !category.parentId)
  .map(mapCategory)
const subcategoryRows = catalog.categories
  .filter((category) => category.parentId)
  .map(mapCategory)

function mapCategory(category) {
  return {
    id: category.id,
    parent_id: category.parentId ?? null,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image_storage_path: category.image?.url ?? null,
    image_alt: category.image?.alt ?? "",
    sort_order: category.order,
    is_active: true,
  }
}

const productRows = catalog.products.map((product) => ({
  id: product.id,
  brand_id: product.brandId,
  name: product.name,
  slug: product.slug,
  description: product.description,
  body: product.body ?? null,
  status: product.status,
  tags: product.tags,
  rating: product.rating,
  review_count: product.reviewCount,
  featured: product.featured,
  created_at: product.createdAt,
  updated_at: product.updatedAt,
}))

const variantRows = catalog.products.flatMap((product) =>
  product.variants.map((variant) => ({
    id: variant.id,
    product_id: product.id,
    sku: variant.sku,
    name: variant.name,
    options: variant.options,
    price_kobo: variant.price,
    compare_at_price_kobo: variant.compareAtPrice ?? null,
    quantity: variant.inventory.quantity,
    track_inventory: variant.inventory.trackInventory,
    allow_backorder: variant.inventory.allowBackorder,
    weight: variant.weight ?? null,
    dimensions: variant.dimensions ?? null,
  }))
)

const productCategoryRows = catalog.products.flatMap((product) =>
  product.categoryIds.map((categoryId, sortOrder) => ({
    product_id: product.id,
    category_id: categoryId,
    sort_order: sortOrder,
  }))
)

const productImageRows = catalog.products.flatMap((product) =>
  product.images.map((image, index) => ({
    // Image IDs are not present in the JSON. This deterministic ID makes reruns idempotent.
    id: `img-${product.id}-${String(index + 1).padStart(2, "0")}`,
    product_id: product.id,
    variant_id: null,
    // The migration makes storage_path unique, while the demo reuses placeholder URLs.
    // Keep the source URL in a unique, clearly non-Storage metadata token; no upload occurs.
    storage_path: `demo-local/${product.id}/${index + 1}::${image.url}`,
    alt: image.alt,
    width: image.width ?? null,
    height: image.height ?? null,
    sort_order: index,
  }))
)

console.log(`Applying catalog upserts to ${new URL(supabaseUrl).host}...`)
await upsert("brands", brandRows)
await upsert("categories", topLevelCategoryRows)
await upsert("categories", subcategoryRows)
await upsert("products", productRows)
await upsert("product_variants", variantRows)
await upsert("product_categories", productCategoryRows, "product_id,category_id")
await upsert("product_images", productImageRows)

console.log("Catalog upsert complete. No Storage uploads or deletes were performed.")
console.log(JSON.stringify(counts, null, 2))
