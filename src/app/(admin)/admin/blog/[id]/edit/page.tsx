import { notFound } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { supabaseAdminBlogRepository } from "@/lib/repositories/supabase-admin-blog-repository"
import { ArticleForm } from "../../article-form"

export default async function EditAdminBlogPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const article = await supabaseAdminBlogRepository.getById(id)
  if (!article) notFound()

  return (
    <div>
      <PageHeader
        title="Edit Article"
        description={`Update ${article.title}.`}
      />
      <ArticleForm article={article} />
    </div>
  )
}
