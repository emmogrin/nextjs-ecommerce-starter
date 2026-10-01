import type { Metadata } from "next"
import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: "Complaints & Order Issues",
  description: "How to report an issue with your Radiant Identity order.",
}

export default function ComplaintsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Complaints &amp; Order Issues
      </h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          We want every order to arrive correctly and in good condition. If
          something is not right, we are here to help.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Report an Issue
        </h2>
        <p>
          If your order is wrong, damaged, incomplete, or otherwise not as
          described, please contact us and include your order number and a
          description of the issue.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          What We Review
        </h2>
        <p>
          Reported issues such as a wrong item, a damaged item, a missing item,
          or a materially incorrect order are reviewed on a case-by-case basis.
          We will respond with the next steps based on the circumstances of your
          order.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Contact</h2>
        <p>
          To report an issue, email us at{" "}
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
