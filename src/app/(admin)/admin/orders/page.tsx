import Link from "next/link"
import { Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { supabaseAdminOrderRepository } from "@/lib/repositories/supabase-admin-order-repository"
import { formatDate, formatPrice } from "@/lib/utils"

export default async function AdminOrdersPage() {
  const orders = await supabaseAdminOrderRepository.list()

  return (
    <div>
      <PageHeader title="Orders" description={`${orders.length} ${orders.length === 1 ? "order" : "orders"}`} />
      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" description="Orders will appear here when customers place them." />
      ) : (
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
                <TableCell><Link className="font-medium underline-offset-4 hover:underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>{order.customerEmail}</TableCell>
                <TableCell>{formatPrice(order.total, "NGN")}</TableCell>
                <TableCell><Badge variant="secondary">{order.paymentStatus}</Badge></TableCell>
                <TableCell><OrderStatusBadge status={order.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
