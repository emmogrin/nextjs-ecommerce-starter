import { NextResponse } from "next/server"
import { z } from "zod"
import { addressSchema } from "@/lib/validators"
import { createClient } from "@/lib/supabase/server"
import { supabaseOrderRepository } from "@/lib/repositories/supabase-order-repository"
import type { CreateOrderInput } from "@/types"

const createOrderSchema = z.object({
  items: z.array(z.object({
    variantId: z.string().trim().min(1),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(50),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
}).strict()

export async function POST(request: Request) {
  const client = await createClient()
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to place an order." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }

  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Order details are invalid." }, { status: 400 })
  }

  const variantIds = parsed.data.items.map((item) => item.variantId)
  if (new Set(variantIds).size !== variantIds.length) {
    return NextResponse.json({ error: "Each product variant can appear only once." }, { status: 400 })
  }

  const input: CreateOrderInput = {
    items: parsed.data.items,
    shippingAddress: parsed.data.shippingAddress,
    billingAddress: parsed.data.billingAddress,
  }

  try {
    const order = await supabaseOrderRepository.create(input)
    return NextResponse.json({ id: order.id, orderNumber: order.orderNumber }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order could not be created."
    const unavailable = /unavailable/i.test(message)
    return NextResponse.json(
      { error: unavailable ? "One or more items are no longer available." : "Order could not be created." },
      { status: unavailable ? 409 : 500 }
    )
  }
}
