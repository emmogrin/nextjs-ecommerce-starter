import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const contactSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(200),
    email: z.string().trim().email("Enter a valid email address.").max(320),
    subject: z.string().trim().min(1, "Subject is required.").max(300),
    message: z.string().trim().min(1, "Message is required.").max(5000),
    orderNumber: z.string().trim().max(100).optional(),
  })
  .strict()

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 })
  }

  const client = await createClient()
  const { error } = await client.from("customer_enquiries").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    order_number: parsed.data.orderNumber || null,
  })

  if (error) {
    return NextResponse.json(
      { error: "Your message could not be sent. Please try again." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
