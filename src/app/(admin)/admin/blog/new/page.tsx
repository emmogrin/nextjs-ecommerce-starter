import { PageHeader } from "@/components/ui/page-header"
import { ArticleForm } from "../article-form"

export default function NewAdminBlogPage() {
  return (
    <div>
      <PageHeader
        title="New Article"
        description="Write and publish a blog article."
      />
      <ArticleForm />
    </div>
  )
}
