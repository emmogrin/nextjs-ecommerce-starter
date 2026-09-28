import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { PageHeader } from "@/components/ui/page-header"
import { supabaseAdminOrderRepository } from "@/lib/repositories/supabase-admin-order-repository"
import { formatDate, formatPrice } from "@/lib/utils"
import { updateOrderStatus } from "../actions"

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"] as const

function AddressDetails({ address }: { address: NonNullable<Awaited<ReturnType<typeof supabaseAdminOrderRepository.getById>>>["shippingAddress"] }) {
  return (
    <address className="not-italic leading-6 text-muted-foreground">
      <span className="block font-medium text-foreground">{address.firstName} {address.lastName}</span>
      {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
      {address.city}, {address.state} {address.postalCode}<br />
      {address.country}{address.phone ? <><br />{address.phone}</> : null}
    </address>
  )
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; updated?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const order = await supabaseAdminOrderRepository.getById(id)
  if (!order) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">&larr; All orders</Link>
        <PageHeader title={order.orderNumber} description={`Placed ${formatDate(order.createdAt)}`} />
      </div>

      {query.updated ? <p role="status" className="rounded-md bg-muted p-3 text-sm">Order status updated.</p> : null}
      {query.error ? <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{query.error === "invalid" ? "Choose a valid order status." : "The order status could not be updated. Refresh and try again."}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Order information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Order status</span><OrderStatusBadge status={order.status} /></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Payment status</span><span className="capitalize">{order.paymentStatus}</span></div>
            <form action={updateOrderStatus} className="flex flex-wrap items-end gap-3 border-t pt-4">
              <input type="hidden" name="orderId" value={order.id} />
              <label className="grid gap-1 text-sm font-medium">Change order status
                <select name="status" defaultValue={order.status} className="h-10 min-w-44 rounded-md border border-input bg-background px-3 font-normal">
                  {statuses.map((status) => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
                </select>
              </label>
              <Button type="submit">Save status</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{order.customerName}</p>
            <p className="text-muted-foreground">{order.customerEmail}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
              {item.image.url ? <img src={item.image.url} alt={item.image.alt || item.name} className="h-16 w-16 rounded-md border object-cover" /> : <div className="h-16 w-16 rounded-md border bg-muted" aria-hidden="true" />}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.variantName || "Standard"}{item.sku ? ` · SKU ${item.sku}` : ""}</p>
                <p className="text-sm text-muted-foreground">Qty {item.quantity} × {formatPrice(item.price, "NGN")}</p>
              </div>
              <p className="font-medium">{formatPrice(item.total, "NGN")}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Shipping address</CardTitle></CardHeader>
          <CardContent><AddressDetails address={order.shippingAddress} /></CardContent>
        </Card>
        {order.billingAddress ? <Card>
          <CardHeader><CardTitle>Billing address</CardTitle></CardHeader>
          <CardContent><AddressDetails address={order.billingAddress} /></CardContent>
        </Card> : null}
        <Card>
          <CardHeader><CardTitle>Totals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal, "NGN")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatPrice(order.shipping, "NGN")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatPrice(order.tax, "NGN")}</span></div>
            <div className="flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{formatPrice(order.total, "NGN")}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
