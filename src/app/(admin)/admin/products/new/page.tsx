import { PageHeader } from "@/components/ui/page-header"
import { brandRepository, categoryRepository } from "@/lib/repositories"
import { ProductForm } from "../product-form"

export default async function NewAdminProductPage() {
  const [brands, categories] = await Promise.all([
    brandRepository.list(),
    categoryRepository.list(),
  ])

  return (
    <div>
      <PageHeader
        title="Add Product"
        description="Add a product to your Supabase catalog."
      />
      <ProductForm brands={brands} categories={categories} />
    </div>
  )
}
