"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Mail } from "lucide-react"
import { toast } from "sonner"
import { siteConfig } from "@/lib/config"
import { contactFormSchema } from "@/lib/validators"

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    orderNumber: "",
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const order = params.get("order")
    if (order) {
      setForm((current) => ({ ...current, orderNumber: order }))
    }
  }, [])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = contactFormSchema.safeParse({
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    setStatus("submitting")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          ...(form.orderNumber ? { orderNumber: form.orderNumber } : {}),
        }),
      })

      if (!response.ok) {
        throw new Error("Submission failed")
      }

      setStatus("success")
      setForm({ name: "", email: "", subject: "", message: "", orderNumber: "" })
    } catch {
      setStatus("error")
      toast.error("Your message could not be sent. Please try again.")
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        title="Contact Us"
        description="Have a question about an order, a product, or Radiant Identity? We'd love to hear from you."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                {siteConfig.contact.email}
              </a>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            {status === "success" && (
              <div
                role="status"
                className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              >
                Your message has been received. Thank you for contacting Radiant
                Identity.
              </div>
            )}
            {status === "error" && (
              <div
                role="alert"
                className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
              >
                Your message could not be sent. Please try again, or email us
                directly at {siteConfig.contact.email}.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    aria-required="true"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="How can we help?"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderNumber">Order number (optional)</Label>
                <Input
                  id="orderNumber"
                  name="orderNumber"
                  placeholder="e.g. RI-20260930-000123"
                  value={form.orderNumber}
                  onChange={handleChange}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Include your order number if this is about a specific order.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Tell us how we can help..."
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={status === "submitting"}>
                {status === "submitting" ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
