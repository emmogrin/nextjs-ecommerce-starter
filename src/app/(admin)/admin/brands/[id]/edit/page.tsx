import { notFound } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { supabaseAdminBrandRepository } from "@/lib/repositories/supabase-admin-brand-repository"
import { BrandForm } from "../../brand-form"

export default async function EditAdminBrandPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const brand = await supabaseAdminBrandRepository.getById(id)
  if (!brand) notFound()

  return (
    <div>
      <PageHeader title="Edit Brand" description={`Update ${brand.name}.`} />
      <BrandForm brand={brand} />
    </div>
  )
}
