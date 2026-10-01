"use client"

import Image from "next/image"
import Link from "next/link"
import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { slugify } from "@/lib/utils"
import type { BlogArticle } from "@/types"
import {
  createArticleAction,
  updateArticleAction,
  type BlogActionState,
} from "./actions"

export function ArticleForm({ article }: { article?: BlogArticle }) {
  const action = article
    ? updateArticleAction.bind(null, article.id)
    : createArticleAction
  const [state, formAction, isPending] = useActionState<BlogActionState, FormData>(
    action,
    {}
  )

  const [title, setTitle] = useState(article?.title ?? "")
  const [slug, setSlug] = useState(article?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(article))

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value
    setTitle(next)
    if (!slugTouched) setSlug(slugify(next))
  }

  function handleSlugChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSlug(event.target.value)
    setSlugTouched(true)
  }

  return (
    <form action={formAction} className="mt-8 max-w-3xl space-y-6">
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="article-title">Title</Label>
        <Input
          id="article-title"
          name="title"
          value={title}
          onChange={handleTitleChange}
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="article-slug">Slug</Label>
        <Input
          id="article-slug"
          name="slug"
          value={slug}
          onChange={handleSlugChange}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          autoComplete="off"
          required
        />
        <p className="text-xs text-muted-foreground">
          Use lowercase letters, numbers, and single hyphens. Generated from the
          title, but you can edit it.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="article-excerpt">Excerpt</Label>
        <Textarea
          id="article-excerpt"
          name="excerpt"
          defaultValue={article?.excerpt ?? ""}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="article-body">Article body</Label>
        <Textarea
          id="article-body"
          name="body"
          defaultValue={article?.body ?? ""}
          rows={14}
          required
        />
        <p className="text-xs text-muted-foreground">
          HTML is supported. The body is rendered as-is on the storefront.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="article-author">Author</Label>
          <Input
            id="article-author"
            name="author"
            defaultValue={article?.author ?? ""}
            autoComplete="off"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="article-category">Category (optional)</Label>
          <Input
            id="article-category"
            name="category"
            defaultValue={article?.category ?? ""}
            autoComplete="off"
          />
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Cover image</h2>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, or AVIF; up to 10 MB.
          </p>
        </div>
        {article?.coverImage && (
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-40 overflow-hidden rounded-md border bg-muted">
              <Image
                src={article.coverImage.url}
                alt={article.coverImage.alt || "Cover image"}
                fill
                unoptimized
                sizes="160px"
                className="object-cover"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="removeCoverImage"
                className="h-4 w-4 rounded border-input accent-foreground"
              />
              Remove current cover image
            </label>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="cover-image">Upload or replace cover image</Label>
          <Input
            id="cover-image"
            name="coverImage"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover-image-alt">Cover image alt text</Label>
          <Input
            id="cover-image-alt"
            name="coverImageAlt"
            defaultValue={article?.coverImage?.alt ?? ""}
            maxLength={500}
          />
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="article-status">Status</Label>
        <select
          id="article-status"
          name="status"
          defaultValue={article?.status ?? "draft"}
          required
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Drafts stay hidden from the storefront. Publishing sets the published
          date; unpublishing returns the article to draft.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : article ? "Save changes" : "Create article"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/blog">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
