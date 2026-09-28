import "server-only"

import type { Order, OrderStatus } from "@/types"
import { createClient } from "@/lib/supabase/server"
import { supabaseOrderRepository } from "@/lib/repositories/supabase-order-repository"

async function requireAdmin() {
  const client = await createClient()
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user) throw new Error("Authentication required")

  const { data: role, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()
  if (error) throw error
  if (role?.role !== "admin") throw new Error("Admin authorization required")
  return client
}

/** Admin order access is checked here and enforced again by orders RLS/private.is_admin(). */
export const supabaseAdminOrderRepository = {
  async list(): Promise<Order[]> {
    await requireAdmin()
    const orders: Order[] = []
    let page = 1
    while (true) {
      const result = await supabaseOrderRepository.list(undefined, { page, limit: 100 })
      orders.push(...result.items)
      if (!result.pagination.hasNext) return orders
      page += 1
    }
  },

  async getById(id: string): Promise<Order | null> {
    await requireAdmin()
    return supabaseOrderRepository.getById(id)
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const client = await requireAdmin()
    const { data, error } = await client
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select("id")
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error("Order not found or update was not authorized")

    const order = await supabaseOrderRepository.getById(id)
    if (!order) throw new Error("Updated order could not be loaded")
    return order
  },
}
