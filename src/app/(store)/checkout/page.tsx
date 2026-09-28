import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CheckoutForm } from "./checkout-form"

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?next=%2Fcheckout")
  }

  if (!user.email) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="mt-4 text-sm text-destructive" role="alert">
          Your Supabase account needs an email address before you can place an order.
        </p>
      </div>
    )
  }

  return <CheckoutForm email={user.email} />
}
