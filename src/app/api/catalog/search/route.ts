import { productRepository } from "@/lib/repositories"

const MIN_QUERY_LENGTH = 2
const RESULT_LIMIT = 6

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? ""
  if (query.length < MIN_QUERY_LENGTH) {
    return Response.json({ items: [] })
  }

  try {
    const result = await productRepository.search(query, {
      page: 1,
      limit: RESULT_LIMIT,
    })
    return Response.json({ items: result.items })
  } catch {
    return Response.json(
      { error: "Catalog search is temporarily unavailable." },
      { status: 500 }
    )
  }
}
