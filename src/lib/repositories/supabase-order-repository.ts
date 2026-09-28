import "server-only"

import type {
  Address,
  CreateOrderInput,
  Order,
  OrderLineItem,
  OrderRepository,
  OrderStatus,
  PaginatedResult,
  PaymentStatus,
  ProductImage,
} from "@/types"
import { createClient } from "@/lib/supabase/server"
import { resolveImageUrl } from "@/lib/repositories/supabase-catalog-mapper"

type OrderItemRow = {
  id: string
  product_id: string | null
  variant_id: string | null
  product_name: string
  variant_name: string | null
  sku: string | null
  image_url: string | null
  unit_price_kobo: number
  quantity: number
  line_total_kobo: number
}

type OrderRow = {
  id: string
  order_number: string
  user_id: string | null
  customer_email: string
  customer_first_name: string
  customer_last_name: string
  status: OrderStatus
  payment_status: PaymentStatus
  currency: "NGN"
  subtotal_kobo: number
  shipping_kobo: number
  tax_kobo: number
  total_kobo: number
  shipping_address: Record<string, unknown>
  billing_address: Record<string, unknown> | null
  created_at: string
  updated_at: string
  order_items: OrderItemRow[]
}

function mapAddress(
  value: Record<string, unknown>,
  orderId: string,
  type: Address["type"]
): Address {
  return {
    id: `${orderId}-${type}`,
    type,
    firstName: String(value.firstName ?? ""),
    lastName: String(value.lastName ?? ""),
    line1: String(value.line1 ?? ""),
    line2: value.line2 ? String(value.line2) : undefined,
    city: String(value.city ?? ""),
    state: String(value.state ?? ""),
    postalCode: String(value.postalCode ?? ""),
    country: String(value.country ?? ""),
    phone: value.phone ? String(value.phone) : undefined,
    isDefault: false,
  }
}

function mapOrder(
  row: OrderRow,
  getPublicImageUrl: (storagePath: string) => string
): Order {
  const items: OrderLineItem[] = row.order_items.map((item) => {
    const image: ProductImage = {
      url: item.image_url ? resolveImageUrl(item.image_url, getPublicImageUrl) : "",
      alt: "",
    }
    return {
      id: item.id,
      productId: item.product_id ?? undefined,
      variantId: item.variant_id ?? undefined,
      name: item.product_name,
      variantName: item.variant_name ?? "",
      sku: item.sku ?? "",
      image,
      price: Number(item.unit_price_kobo),
      quantity: item.quantity,
      total: Number(item.line_total_kobo),
    }
  })

  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id ?? undefined,
    items,
    status: row.status,
    paymentStatus: row.payment_status,
    subtotal: Number(row.subtotal_kobo),
    shipping: Number(row.shipping_kobo),
    tax: Number(row.tax_kobo),
    total: Number(row.total_kobo),
    currency: "NGN",
    shippingAddress: mapAddress(row.shipping_address, row.id, "shipping"),
    billingAddress: row.billing_address
      ? mapAddress(row.billing_address, row.id, "billing")
      : undefined,
    customerEmail: row.customer_email,
    customerName: `${row.customer_first_name} ${row.customer_last_name}`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function loadOrder(id: string): Promise<Order | null> {
  const client = await createClient()
  const { data, error } = await client
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  const getPublicImageUrl = (path: string) =>
    client.storage.from("product-images").getPublicUrl(path).data.publicUrl
  return data
    ? mapOrder(data as unknown as OrderRow, getPublicImageUrl)
    : null
}

async function requireAdmin(client: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) throw new Error("Authentication required")

  const { data, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) throw error
  if (data?.role !== "admin") throw new Error("Admin authorization required")
}

export const supabaseOrderRepository: OrderRepository = {
  async list(userId, pagination): Promise<PaginatedResult<Order>> {
    const client = await createClient()
    const page = Math.max(1, pagination?.page ?? 1)
    const limit = Math.min(100, Math.max(1, pagination?.limit ?? 20))
    let query = client
      .from("orders")
      .select("*, order_items(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (userId) query = query.eq("user_id", userId)

    const { data, error, count } = await query
    if (error) throw error

    const total = count ?? 0
    const totalPages = Math.ceil(total / limit)
    return {
      items: (data ?? []).map((row) => mapOrder(
        row as unknown as OrderRow,
        (path) => client.storage.from("product-images").getPublicUrl(path).data.publicUrl
      )),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  },

  getById: loadOrder,

  async create(input: CreateOrderInput): Promise<{ id: string; orderNumber: string }> {
    const client = await createClient()
    const { data: { user }, error: userError } = await client.auth.getUser()
    if (userError || !user) throw new Error("Authentication required")

    const { data, error } = await client.rpc("create_order", {
      p_items: input.items.map(({ variantId, quantity }) => ({ variantId, quantity })),
      p_shipping_address: input.shippingAddress,
      p_billing_address: input.billingAddress ?? null,
    })
    if (error) throw error

    const result = data as unknown as { id?: string; orderNumber?: string }
    if (!result?.id || !result.orderNumber) {
      throw new Error("Order creation returned an invalid result")
    }
    return { id: result.id, orderNumber: result.orderNumber }
  },

  async updateStatus(
    id: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ): Promise<Order> {
    const client = await createClient()
    await requireAdmin(client)

    const update: { status: OrderStatus; payment_status?: PaymentStatus } = { status }
    if (paymentStatus) update.payment_status = paymentStatus

    const { data, error } = await client
      .from("orders")
      .update(update)
      .eq("id", id)
      .select("id")
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error("Order not found or update was not authorized")

    const order = await loadOrder(id)
    if (!order) throw new Error("Updated order could not be loaded")
    return order
  },
}
