import type { Metadata } from "next"
import { formatPrice } from "@/lib/utils"
import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: "Delivery Policy",
  description: "How Radiant Identity handles delivery across Nigeria.",
}

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Delivery Policy</h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          Radiant Identity delivers within Nigeria. Prices are listed in
          Nigerian Naira (₦), and delivery is confirmed according to your order
          and location.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Free Delivery
        </h2>
        <p>
          Orders over {formatPrice(siteConfig.freeShippingThreshold)} qualify
          for free delivery.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Delivery Charges and Timelines
        </h2>
        <p>
          Delivery charges and timelines are confirmed according to your order
          and delivery location. Final delivery details are confirmed with you
          for your order rather than applied as a single fixed rate.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Delivery Area
        </h2>
        <p>
          We currently deliver within Nigeria. International delivery is not
          currently available.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Questions About Your Order
        </h2>
        <p>
          For questions about a specific order, contact us at{" "}
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="underline hover:text-foreground"
          >
            {siteConfig.contact.email}
          </a>
          .
        </p>
      </div>
    </div>
  )
}
