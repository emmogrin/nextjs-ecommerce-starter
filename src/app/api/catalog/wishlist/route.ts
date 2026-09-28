import { productRepository } from "@/lib/repositories"

const MAX_WISHLIST_ITEMS = 100

export async function POST(request: Request) {
  let productIds: unknown
  try {
    const body = (await request.json()) as { productIds?: unknown }
    productIds = body.productIds
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (
    !Array.isArray(productIds) ||
    productIds.length > MAX_WISHLIST_ITEMS ||
    productIds.some((id) => typeof id !== "string" || id.length === 0 || id.length > 128)
  ) {
    return Response.json({ error: "Invalid wishlist product IDs." }, { status: 400 })
  }

  if (productIds.length === 0) return Response.json({ products: [] })

  try {
    const result = await productRepository.list(undefined, undefined, {
      page: 1,
      limit: 10_000,
    })
    const wantedIds = new Set(productIds)
    return Response.json({
      products: result.items.filter((product) => wantedIds.has(product.id)),
    })
  } catch {
    return Response.json(
      { error: "Wishlist products are temporarily unavailable." },
      { status: 500 }
    )
  }
}
