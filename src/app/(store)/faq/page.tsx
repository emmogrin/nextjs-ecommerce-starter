import type { Metadata } from "next"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { formatPrice } from "@/lib/utils"
import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Radiant Identity.",
}

const faqs = [
  {
    question: "What is Radiant Identity?",
    answer:
      "Radiant Identity is a curated beauty storefront featuring skincare, body care, hair care, makeup, and fragrance essentials thoughtfully selected to help you look, feel, and live radiant.",
  },
  {
    question: "How do I shop or place an order?",
    answer:
      "Browse the store, add products to your cart, and proceed to checkout. You will be asked to sign in so we can record your order and its delivery details.",
  },
  {
    question: "What currency is used?",
    answer: "All prices are listed in Nigerian Naira (₦).",
  },
  {
    question: "Is checkout currently live?",
    answer:
      "Checkout is currently in demo mode. You can place an order, but no real payment is taken. Orders are recorded without a charge while real payment processing is still being set up.",
  },
  {
    question: "How does delivery work?",
    answer:
      "Delivery is available within Nigeria. Delivery charges and timelines are confirmed based on your order and delivery location.",
  },
  {
    question: "When is delivery free?",
    answer: `Orders over ${formatPrice(siteConfig.freeShippingThreshold)} qualify for free delivery.`,
  },
  {
    question: "What if there is an issue with my order?",
    answer:
      "If your order is wrong, damaged, incomplete, or not as described, please contact us with your order number and a description of the issue. Reported issues are reviewed and handled according to the circumstances.",
  },
  {
    question: "How can I contact Radiant Identity?",
    answer: `You can email us at ${siteConfig.contact.email} or reach us through our contact page.`,
  },
  {
    question: "Are products from different beauty brands featured?",
    answer:
      "Radiant Identity curates beauty and skincare products across skincare, body care, hair care, makeup, and fragrance categories.",
  },
]

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Frequently Asked Questions
      </h1>
      <p className="mt-4 text-muted-foreground">
        Find answers to common questions about Radiant Identity, ordering,
        delivery, and more.
      </p>

      <Accordion className="mt-8">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 rounded-lg border bg-neutral-50 p-6 text-center">
        <h2 className="text-lg font-semibold">Still have questions?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We are happy to help with any other questions.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block text-sm font-medium underline hover:text-foreground"
        >
          Contact Support
        </Link>
      </div>
    </div>
  )
}
