"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { OrderStatus } from "@/types"
import { supabaseAdminOrderRepository } from "@/lib/repositories/supabase-admin-order-repository"

const allowedStatuses: OrderStatus[] = [
  "pending", "processing", "shipped", "delivered", "cancelled", "refunded",
]

export async function updateOrderStatus(formData: FormData) {
  const id = String(formData.get("orderId") ?? "")
  const status = String(formData.get("status") ?? "")
  if (!id || !allowedStatuses.includes(status as OrderStatus)) {
    redirect(`/admin/orders/${encodeURIComponent(id)}?error=invalid`)
  }

  try {
    await supabaseAdminOrderRepository.updateStatus(id, status as OrderStatus)
  } catch {
    redirect(`/admin/orders/${encodeURIComponent(id)}?error=update`)
  }

  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${id}`)
  redirect(`/admin/orders/${id}?updated=1`)
}
