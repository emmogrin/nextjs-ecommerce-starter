import Link from "next/link"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Package } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { createClient } from "@/lib/supabase/server"
import { supabaseOrderRepository } from "@/lib/repositories/supabase-order-repository"
import { formatDate, formatPrice } from "@/lib/utils"

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?next=%2Faccount%2Forders")
  }

  const result = await supabaseOrderRepository.list(user.id, { page: 1, limit: 100 })
  const orders = result.items

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        title="Order History"
        description={orders.length > 0 ? `${orders.length} ${orders.length === 1 ? "order" : "orders"}` : undefined}
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place an order, it will appear here."
          actionLabel="Start Shopping"
          actionHref="/shop"
        />
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm font-medium">{formatPrice(order.total, order.currency)}</span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {order.items.map((item) => (
                    <span key={item.id} className="mr-3">
                      {item.name} &times; {item.quantity}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/checkout/success?order_id=${encodeURIComponent(order.id)}`}
                  className="mt-4 inline-block text-sm underline underline-offset-4"
                >
                  View order
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
