import Link from "next/link"
import { FileText, Plus } from "lucide-react"
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
import { supabaseAdminBlogRepository } from "@/lib/repositories/supabase-admin-blog-repository"
import { formatDate } from "@/lib/utils"
import { DeleteArticleButton } from "./delete-article-button"

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [{ error }] = await Promise.all([searchParams])
  const articles = await supabaseAdminBlogRepository.list()

  return (
    <div>
      <PageHeader
        title="Blog"
        description={`${articles.length} ${articles.length === 1 ? "article" : "articles"}.`}
      >
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Link>
        </Button>
      </PageHeader>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error === "delete"
            ? "The article could not be deleted. Please try again."
            : "Something went wrong. Please try again."}
        </p>
      )}

      {articles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No articles yet"
          description="Create your first article to start the blog."
          actionLabel="New Article"
          actionHref="/admin/blog/new"
        />
      ) : (
        <div className="mt-8 rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Link
                      href={`/admin/blog/${article.id}/edit`}
                      className="font-medium hover:underline"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{article.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={article.status === "published" ? "default" : "secondary"}
                    >
                      {article.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{article.author || "—"}</TableCell>
                  <TableCell>{article.category ?? "—"}</TableCell>
                  <TableCell>
                    {article.publishedAt ? formatDate(article.publishedAt) : "—"}
                  </TableCell>
                  <TableCell>{formatDate(article.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/blog/${article.id}/edit`}>Edit</Link>
                      </Button>
                      <DeleteArticleButton id={article.id} />
                    </div>
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
