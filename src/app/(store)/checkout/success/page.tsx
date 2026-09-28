import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/server"
import { supabaseOrderRepository } from "@/lib/repositories/supabase-order-repository"
import { formatDate, formatPrice } from "@/lib/utils"

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const orderId = typeof params.order_id === "string" ? params.order_id : ""
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const destination = orderId
      ? `/checkout/success?order_id=${encodeURIComponent(orderId)}`
      : "/checkout/success"
    redirect(`/auth/login?next=${encodeURIComponent(destination)}`)
  }

  let order = null
  try {
    order = orderId ? await supabaseOrderRepository.getById(orderId) : null
  } catch {
    // Keep database details server-side and show the same safe unavailable state.
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">Order not found</h1>
        <p className="mt-4 text-muted-foreground">
          We couldn&apos;t find that order for your account. Check your order history or return to the shop.
        </p>
        <div className="mt-8 flex gap-4">
          <Button asChild><Link href="/account/orders">View Orders</Link></Button>
          <Button variant="outline" asChild><Link href="/shop">Continue Shopping</Link></Button>
        </div>
      </div>
    )
  }

  const address = order.shippingAddress

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Order received</h1>
        <p className="mt-4 text-muted-foreground">
          Order {order.orderNumber} is pending. No payment has been processed.
        </p>
      </div>

      <Card className="mt-8 w-full text-left">
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order number</span>
            <span className="font-medium">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment status</span>
            <span className="capitalize">{order.paymentStatus}</span>
          </div>
          <Separator />
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                {item.name}{item.variantName ? ` — ${item.variantName}` : ""} &times; {item.quantity}
              </span>
              <span className="shrink-0">{formatPrice(item.total, order.currency)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotal, order.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>{order.shipping === 0 ? "₦0" : formatPrice(order.shipping, order.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatPrice(order.tax, order.currency)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatPrice(order.total, order.currency)}</span>
          </div>
          <Separator />
          <div className="text-sm">
            <p className="font-medium">Shipping address</p>
            <p className="mt-1 text-muted-foreground">
              {address.firstName} {address.lastName}<br />
              {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
              {address.city}, {address.state} {address.postalCode}<br />
              {address.country}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center gap-4">
        <Button asChild><Link href="/account/orders">View Orders</Link></Button>
        <Button variant="outline" asChild><Link href="/shop">Continue Shopping</Link></Button>
      </div>
    </div>
  )
}
