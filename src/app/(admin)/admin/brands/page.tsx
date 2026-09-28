import Image from "next/image"
import Link from "next/link"
import { Plus, Tags } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabaseAdminBrandRepository } from "@/lib/repositories/supabase-admin-brand-repository"

export default async function AdminBrandsPage() {
  const brands = await supabaseAdminBrandRepository.list()

  return (
    <div>
      <PageHeader title="Brands" description={`${brands.length} brands in your catalog.`}>
        <Button asChild>
          <Link href="/admin/brands/new"><Plus className="mr-2 h-4 w-4" />Add Brand</Link>
        </Button>
      </PageHeader>

      {brands.length === 0 ? (
        <EmptyState icon={Tags} title="No brands found" description="Create a brand to organize products in your catalog." />
      ) : (
        <div className="mt-8 rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {brand.logoUrl ? (
                          <Image src={brand.logoUrl} alt={`${brand.name} logo`} fill unoptimized sizes="40px" className="object-contain" />
                        ) : <Tags className="m-2 h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/brands/${brand.id}/edit`} className="font-medium hover:underline">{brand.name}</Link>
                        <p className="text-xs text-muted-foreground">{brand.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md whitespace-normal text-muted-foreground">{brand.description || "—"}</TableCell>
                  <TableCell>{brand.productCount}</TableCell>
                  <TableCell><Badge variant={brand.isActive ? "default" : "secondary"}>{brand.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
