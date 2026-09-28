import { notFound } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { brandRepository, categoryRepository } from "@/lib/repositories"
import { supabaseAdminProductRepository } from "@/lib/repositories/supabase-admin-product-repository"
import { ProductForm } from "../../product-form"

export default async function EditAdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, brands, categories, images] = await Promise.all([
    supabaseAdminProductRepository.getById(id),
    brandRepository.list(),
    categoryRepository.list(),
    supabaseAdminProductRepository.listImages(id),
  ])

  if (!product) notFound()

  return (
    <div>
      <PageHeader
        title="Edit Product"
        description={`Update ${product.name}.`}
      />
      <ProductForm
        product={product}
        brands={brands}
        categories={categories}
        images={images}
      />
    </div>
  )
}
