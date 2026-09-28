import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/config"
import { ProductGrid } from "@/components/products/product-grid"
import { NewsletterForm } from "@/components/layout/newsletter-form"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { productRepository, categoryRepository } from "@/lib/repositories"

const HERO_PORTRAIT_SRC = "/images/home/radiant-hero-portrait.webp"

export const metadata: Metadata = {
  title: "Radiant Identity | Beauty, Skincare & Self-Care",
  description:
    "Discover premium skincare and beauty essentials thoughtfully selected to help you look, feel, and live radiant.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Radiant Identity | Beauty, Skincare & Self-Care",
    description:
      "Discover premium skincare and beauty essentials thoughtfully selected to help you look, feel, and live radiant.",
    type: "website",
    url: siteConfig.url,
  },
  keywords: ["Radiant Identity", "beauty", "skincare", "body care", "hair care", "makeup", "fragrance"],
}

export default async function HomePage() {
  const categories = await categoryRepository.getTopLevel()
  const featuredProducts = await productRepository.getFeatured(4)


  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#f6f1ea]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_76%_48%,rgba(225,205,183,0.36),transparent_48%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute left-[16%] right-[-16%] top-0 h-[500px] sm:h-[560px] lg:inset-x-auto lg:right-[-8%] lg:top-[5%] lg:h-[92%] lg:w-[68%]" aria-hidden="true">
          <Image
            src={HERO_PORTRAIT_SRC}
            alt="Beauty portrait in warm natural light"
            fill
            preload
            className="object-cover object-[54%_26%] [mask-image:linear-gradient(to_bottom,black_62%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_62%,transparent_100%)] lg:object-[center_18%] lg:[mask-image:radial-gradient(ellipse_at_58%_48%,black_48%,transparent_78%)] lg:[-webkit-mask-image:radial-gradient(ellipse_at_58%_48%,black_48%,transparent_78%)]"
            sizes="(max-width: 1023px) 100vw, 68vw"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-gradient-to-r from-[#f6f1ea] via-[#f6f1ea]/65 to-transparent sm:h-[560px] lg:hidden" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 top-[245px] h-[300px] bg-gradient-to-b from-transparent via-[#f6f1ea]/90 to-[#f6f1ea] sm:top-[285px] sm:h-[340px] lg:hidden" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[660px] w-full max-w-[1440px] items-start px-4 pb-12 pt-[260px] sm:min-h-[720px] sm:px-6 sm:pb-16 sm:pt-[300px] lg:min-h-[600px] lg:items-center lg:px-8 lg:py-16">
          <div className="relative z-10 max-w-xl lg:w-[54%]">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#806b58]">
              Your beauty, thoughtfully found
            </p>
            <h1 className="font-heading text-5xl font-medium leading-[1.02] tracking-[-0.055em] text-[#342a24] sm:text-6xl lg:text-7xl">
              Reveal Your
              <br />
              <span className="font-normal italic text-[#876b53]">Radiance</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#6d6259] sm:text-lg sm:leading-8">
              Discover premium skincare and beauty essentials thoughtfully selected to help you look, feel, and live radiant.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" className="h-12 rounded-full bg-[#42352d] px-7 text-white hover:bg-[#57463a]" asChild>
                <Link href="/shop">
                  Shop Now
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-full border-[#b8a999] bg-transparent px-7 text-[#42352d] hover:bg-white/70" asChild>
                <Link href="/shop" target="_blank" rel="noopener">
                  Explore Collections
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#806b58]">Find your ritual</p>
            <h2 className="text-3xl font-medium tracking-tight text-[#342a24] sm:text-4xl">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="mb-1 inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[#625448] transition-colors hover:text-[#342a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-5 lg:gap-x-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/${category.slug}`} className="group">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f1ece5]">
                <Image
                  src={category.image?.url ?? PLACEHOLDER_IMAGE}
                  alt={category.image?.alt ?? category.name}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 19vw"
                />
                <span className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-1 items-center justify-center bg-white/90 text-[#42352d] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium tracking-wide text-[#342a24] sm:text-base">
                  {category.name}
                </h3>
                <ArrowRight className="h-4 w-4 text-[#8a7867] transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-12 sm:px-6 sm:pb-24 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#806b58]">Thoughtfully selected</p>
            <h2 className="text-3xl font-medium tracking-tight text-[#342a24] sm:text-4xl">
              Featured Products
            </h2>
          </div>
          <Link
            href="/shop"
            className="mb-1 inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[#625448] transition-colors hover:text-[#342a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-9">
          <ProductGrid products={featuredProducts} featured />
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-[#423831] text-[#fbf7f1]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d8c4b0]">Notes from Radiant Identity</p>
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
            A little radiance, in your inbox.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#d5ccc3] sm:text-base">
            Get updates on new arrivals and exclusive offers.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  )
}
