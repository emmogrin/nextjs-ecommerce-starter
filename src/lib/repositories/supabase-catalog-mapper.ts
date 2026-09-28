import type {
  Brand,
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductVariant,
} from "@/types"

type ImageRow = {
  id: string
  product_id: string
  variant_id: string | null
  storage_path: string
  alt: string
  width: number | null
  height: number | null
  sort_order: number
}

type VariantRow = {
  id: string
  product_id: string
  sku: string
  name: string
  options: ProductOption[] | null
  price_kobo: number
  compare_at_price_kobo: number | null
  quantity: number
  track_inventory: boolean
  allow_backorder: boolean
  weight: number | null
  dimensions: { length?: number; width?: number; height?: number } | null
}

type ProductRow = {
  id: string
  brand_id: string
  name: string
  slug: string
  description: string
  body: string | null
  status: Product["status"]
  tags: string[]
  rating: number
  review_count: number
  featured: boolean
  created_at: string
  updated_at: string
}

type ProductCategoryRow = {
  product_id: string
  category_id: string
  sort_order: number
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
}

type BrandRow = Pick<Brand, "id" | "name" | "slug" | "description">

export type ProductCatalogRows = {
  products: ProductRow[]
  variants: VariantRow[]
  images: ImageRow[]
  productCategories: ProductCategoryRow[]
}

export type PublicImageUrl = (storagePath: string) => string

export function mapProductImage(
  row: ImageRow,
  getPublicImageUrl: PublicImageUrl
): ProductImage {
  return {
    url: resolveImageUrl(row.storage_path, getPublicImageUrl),
    alt: row.alt,
    ...(row.width === null ? {} : { width: row.width }),
    ...(row.height === null ? {} : { height: row.height }),
  }
}

export function mapProduct(
  row: ProductRow,
  rows: ProductCatalogRows,
  getPublicImageUrl: PublicImageUrl
): Product {
  const productImages = rows.images
    .filter((image) => image.product_id === row.id)
    .sort((a, b) => a.sort_order - b.sort_order)
  const variants = rows.variants
    .filter((variant) => variant.product_id === row.id)
    .map((variant) => mapVariant(variant, productImages, getPublicImageUrl))

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    ...(row.body === null ? {} : { body: row.body }),
    images: productImages
      .filter((image) => image.variant_id === null)
      .map((image) => mapProductImage(image, getPublicImageUrl)),
    status: row.status,
    brandId: row.brand_id,
    categoryIds: rows.productCategories
      .filter((category) => category.product_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((category) => category.category_id),
    tags: row.tags ?? [],
    variants,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapCategory(
  row: CategoryRow,
  getPublicImageUrl: PublicImageUrl
): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    ...(row.image_storage_path
      ? {
          image: {
            url: resolveImageUrl(row.image_storage_path, getPublicImageUrl),
            alt: row.image_alt,
          },
        }
      : {}),
    ...(row.parent_id === null ? {} : { parentId: row.parent_id }),
    order: row.sort_order,
  }
}

export function mapBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  }
}

export function resolveImageUrl(
  storagePath: string,
  getPublicImageUrl: PublicImageUrl
): string {
  const demoLocalSeparator = "::"
  const demoLocalIndex = storagePath.indexOf(demoLocalSeparator)
  if (storagePath.startsWith("demo-local/") && demoLocalIndex !== -1) {
    return storagePath.slice(demoLocalIndex + demoLocalSeparator.length)
  }

  if (storagePath.startsWith("/")) return storagePath
  return getPublicImageUrl(storagePath)
}

function mapVariant(
  row: VariantRow,
  productImages: ImageRow[],
  getPublicImageUrl: PublicImageUrl
): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    name: row.name,
    price: Number(row.price_kobo),
    ...(row.compare_at_price_kobo === null
      ? {}
      : { compareAtPrice: Number(row.compare_at_price_kobo) }),
    currency: "NGN",
    inventory: {
      quantity: row.quantity,
      trackInventory: row.track_inventory,
      allowBackorder: row.allow_backorder,
    },
    options: row.options ?? [],
    images: productImages
      .filter((image) => image.variant_id === row.id)
      .map((image) => mapProductImage(image, getPublicImageUrl)),
    ...(row.weight === null ? {} : { weight: Number(row.weight) }),
    ...(row.dimensions
      ? {
          dimensions: {
            length: row.dimensions.length ?? 0,
            width: row.dimensions.width ?? 0,
            height: row.dimensions.height ?? 0,
          },
        }
      : {}),
  }
}
