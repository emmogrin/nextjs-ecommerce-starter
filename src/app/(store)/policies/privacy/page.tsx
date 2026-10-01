import type { Metadata } from "next"
import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Radiant Identity collects and uses your information.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated: September 30, 2026
      </p>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">
          Information We Collect
        </h2>
        <p>
          We collect information you provide to us, including your email address
          when you create or sign in to your account, and the name and delivery
          and billing details you submit when you place an order. We store order
          information so you can view your order history.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Information Stored on Your Device
        </h2>
        <p>
          Your cart, wishlist, and recently viewed products are stored locally
          in your browser. They are not sent to us until you place an order or
          otherwise submit them.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          How We Use Your Information
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>To create and manage your account</li>
          <li>To process and manage your orders</li>
          <li>To respond to questions and order issues</li>
          <li>To operate and improve the storefront</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground">Payments</h2>
        <p>
          Radiant Identity does not currently process real payments and does not
          store your payment details. When you place an order, it is recorded
          and no payment is taken.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Who Can Access Your Information
        </h2>
        <p>
          Authorized store administrators can access the information needed to
          operate the store, including order details and account information.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Contact</h2>
        <p>
          For privacy questions or requests, contact us at{" "}
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
