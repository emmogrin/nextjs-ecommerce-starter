import { notFound } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { supabaseAdminCategoryRepository } from "@/lib/repositories/supabase-admin-category-repository"
import { CategoryForm } from "../../category-form"

export default async function EditAdminCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [category, categories] = await Promise.all([
    supabaseAdminCategoryRepository.getById(id),
    supabaseAdminCategoryRepository.list(),
  ])
  if (!category) notFound()

  const blockedParentIds = new Set([category.id])
  let foundDescendant = true
  while (foundDescendant) {
    foundDescendant = false
    for (const candidate of categories) {
      if (candidate.parentId && blockedParentIds.has(candidate.parentId) && !blockedParentIds.has(candidate.id)) {
        blockedParentIds.add(candidate.id)
        foundDescendant = true
      }
    }
  }

  const parentCategories = categories
    .filter((candidate) => !blockedParentIds.has(candidate.id))
    .map(({ id: parentId, name }) => ({ id: parentId, name }))

  return (
    <div>
      <PageHeader title="Edit Category" description={`Update ${category.name}.`} />
      <CategoryForm category={category} parentCategories={parentCategories} />
    </div>
  )
}
