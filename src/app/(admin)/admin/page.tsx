import Link from "next/link"
import {
  CircleDollarSign,
  CreditCard,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { PageHeader } from "@/components/ui/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"
import { formatDate, formatPrice } from "@/lib/utils"

type DashboardOrder = {
  id: string
  order_number: string
  customer_email: string
  total_kobo: number | string
  payment_status: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  created_at: string
}

function sumKobo(rows: { total_kobo: number | string }[] | null) {
  return (rows ?? []).reduce((sum, row) => sum + BigInt(row.total_kobo), BigInt(0))
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const [ordersCount, capturedOrders, pendingOrders, activeProducts, customers, recentOrders] =
    await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total_kobo").eq("payment_status", "captured"),
      supabase.from("orders").select("total_kobo").eq("payment_status", "pending"),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "customer"),
      supabase
        .from("orders")
        .select("id, order_number, customer_email, total_kobo, payment_status, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  const dataErrors = [
    ordersCount.error && "Total orders could not be loaded.",
    capturedOrders.error && "Captured revenue could not be loaded.",
    pendingOrders.error && "Pending payment value could not be loaded.",
    activeProducts.error && "Active products could not be loaded.",
    customers.error && "Customer accounts could not be loaded.",
    recentOrders.error && "Recent orders could not be loaded.",
  ].filter((message): message is string => Boolean(message))

  const metrics = [
    {
      name: "Captured Revenue",
      value: capturedOrders.error ? null : formatPrice(Number(sumKobo(capturedOrders.data)), "NGN"),
      icon: CircleDollarSign,
    },
    {
      name: "Total Orders",
      value: ordersCount.error ? null : String(ordersCount.count ?? 0),
      icon: ShoppingCart,
    },
    {
      name: "Active Products",
      value: activeProducts.error ? null : String(activeProducts.count ?? 0),
      icon: Package,
    },
    {
      name: "Customer Accounts",
      value: customers.error ? null : String(customers.count ?? 0),
      icon: Users,
    },
    {
      name: "Pending Payment Value",
      value: pendingOrders.error ? null : formatPrice(Number(sumKobo(pendingOrders.data)), "NGN"),
      icon: CreditCard,
    },
  ]

  const orders = (recentOrders.data ?? []) as DashboardOrder[]

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your store performance." />

      {dataErrors.length > 0 && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <p className="font-medium">Some dashboard data could not be loaded.</p>
          <ul className="mt-2 list-inside list-disc">
            {dataErrors.map((message) => <li key={message}>{message}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.name}
              </CardTitle>
              <metric.icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metric.value ?? "Unavailable"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Five Most Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.error ? (
            <p className="text-sm text-destructive" role="status">
              Recent orders are unavailable because the orders query failed.
            </p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link className="font-medium hover:underline" href={`/admin/orders/${order.id}`}>
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(order.created_at)}</TableCell>
                      <TableCell>{order.customer_email}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatPrice(Number(order.total_kobo), "NGN")}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{order.payment_status}</Badge></TableCell>
                      <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
