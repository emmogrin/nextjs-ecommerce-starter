import Image from "next/image"
import Link from "next/link"
import { FolderTree, Plus } from "lucide-react"
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
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { supabaseAdminCategoryRepository } from "@/lib/repositories/supabase-admin-category-repository"

export default async function AdminCategoriesPage() {
  const categories = await supabaseAdminCategoryRepository.list()

  return (
    <div>
      <PageHeader title="Categories" description={`${categories.length} categories in your catalog.`}>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Link>
        </Button>
      </PageHeader>

      {categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories found"
          description="Create a category to organize products in your catalog."
          actionLabel="Add Category"
          actionHref="/admin/categories/new"
        />
      ) : (
        <div className="mt-8 rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Sort order</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                        <Image
                          src={category.imageUrl ?? PLACEHOLDER_IMAGE}
                          alt={category.imageAlt || category.name}
                          fill
                          unoptimized
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          className="font-medium hover:underline"
                        >
                          {category.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{category.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{category.parentName ?? "Top-level"}</TableCell>
                  <TableCell>{category.productCount}</TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
