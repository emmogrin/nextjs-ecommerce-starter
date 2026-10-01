import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { breadcrumbJsonLd } from "@/lib/structured-data"
import { blogRepository } from "@/lib/repositories"
import { formatDate } from "@/lib/utils"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { siteConfig } from "@/lib/config"

interface PostProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PostProps): Promise<Metadata> {
  const { slug } = await params
  const post = await blogRepository.getBySlug(slug)
  if (!post) return { title: "Not Found" }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `${siteConfig.url}/blog/${post.slug}`,
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      authors: [post.author],
      ...(post.category ? { tags: [post.category] } : {}),
      images: post.coverImage
        ? [{ url: post.coverImage.url, alt: post.coverImage.alt }]
        : [],
    },
  }
}

export default async function BlogPostPage({ params }: PostProps) {
  const { slug } = await params
  const post = await blogRepository.getBySlug(slug)
  if (!post) notFound()

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author },
    ...(post.coverImage?.url ? { image: post.coverImage.url } : {}),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            articleJsonLd,
            breadcrumbJsonLd([
              { name: "Blog", href: "/blog" },
              { name: post.title, href: `/blog/${post.slug}` },
            ]),
          ]),
        }}
      />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/blog" />}>Blog</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{post.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <article className="mt-6">
        <header>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            )}
            {post.publishedAt && <span>·</span>}
            <span>{post.author}</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
        </header>

        <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-lg bg-neutral-100">
          <Image
            src={post.coverImage?.url ?? PLACEHOLDER_IMAGE}
            alt={post.coverImage?.alt ?? post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>

        <div
          className="blog-body mt-10"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {post.category && (
          <footer className="mt-12 border-t pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Category:</span>
              <Badge variant="secondary" className="text-xs">
                {post.category}
              </Badge>
            </div>
          </footer>
        )}
      </article>
    </div>
  )
}
