import { PageHeader } from "@/components/ui/page-header"
import { supabaseAdminCategoryRepository } from "@/lib/repositories/supabase-admin-category-repository"
import { CategoryForm } from "../category-form"

export default async function NewAdminCategoryPage() {
  const categories = await supabaseAdminCategoryRepository.list()

  return (
    <div>
      <PageHeader title="Add Category" description="Create a category for your catalog." />
      <CategoryForm parentCategories={categories.map(({ id, name }) => ({ id, name }))} />
    </div>
  )
}
