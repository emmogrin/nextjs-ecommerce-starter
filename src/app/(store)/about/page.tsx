import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About",
  description:
    "Radiant Identity is a curated beauty and skincare destination helping you discover products that celebrate your natural glow.",
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Our Story</h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          Radiant Identity began with a simple belief: beauty should feel like
          an act of self-discovery, not a standard to live up to. We curate
          skincare, body care, hair care, makeup, and fragrance with one goal —
          helping you reveal the radiance that is already yours.
        </p>
        <p>
          Every product in our storefront is chosen thoughtfully. We look for
          formulas that nurture, textures that feel indulgent, and brands that
          care about the details — so that each ritual, from your morning
          cleanse to your evening wind-down, becomes a moment worth savoring.
        </p>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          Thoughtful Curation
        </h2>
        <p>
          We don&apos;t believe in overwhelming choice. Our catalog is edited
          with intention, so you can explore with confidence and find pieces
          that suit your skin, your hair, and your rhythm.
        </p>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          Beauty for Every Identity
        </h2>
        <p>
          Radiance looks different on everyone, and that&apos;s the point. Our
          collection celebrates the full spectrum of beauty — designed to help
          you look, feel, and live radiant on your own terms.
        </p>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          Your Ritual, Elevated
        </h2>
        <p>
          Whether you&apos;re building your first routine or refining a
          long-loved one, we&apos;re here to make every step feel effortless
          and indulgent. Explore the collection and find your next favorite
          ritual.
        </p>

        <div className="!mt-12">
          <Link
            href="/shop"
            className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
          >
            Explore the collection
          </Link>
        </div>
      </div>
    </div>
  )
}
