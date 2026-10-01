import type { Metadata } from "next"
import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using the Radiant Identity store.",
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated: September 30, 2026
      </p>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">
          Acceptance of Terms
        </h2>
        <p>
          By accessing and using this website, you agree to these terms. If you
          do not agree, please do not use the store.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Accounts</h2>
        <p>
          You may create an account using your email address. You are responsible
          for keeping your sign-in details secure and for activity under your
          account.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Products and Pricing
        </h2>
        <p>
          Product descriptions and availability are shown on the storefront.
          Prices are listed in Nigerian Naira (₦). We aim to keep product
          information accurate and may update or correct it as needed.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Orders</h2>
        <p>
          Placing an order creates an order record in our system. Order details,
          including delivery information, are confirmed according to the
          products and location in your order.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Payments</h2>
        <p>
          The current checkout is a demo. No real payment is processed through
          the current demo provider, and placing an order does not charge you.
          Real payment processing is not yet available.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Delivery</h2>
        <p>
          Delivery is available within Nigeria. Delivery charges and timelines
          are confirmed based on your order and location. See our Delivery
          Policy for more information.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Complaints and Order Issues
        </h2>
        <p>
          If there is an issue with your order, please contact us. Reported
          issues are reviewed and handled according to the circumstances and
          applicable policy.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Intellectual Property
        </h2>
        <p>
          All content on this website, including text, images, and branding,
          belongs to Radiant Identity or its licensors and may not be reproduced
          without permission.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Prohibited Misuse
        </h2>
        <p>
          You agree not to misuse the store, including attempting to interfere
          with its operation or using it for unlawful purposes.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Contact</h2>
        <p>
          For questions about these terms, contact us at{" "}
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
