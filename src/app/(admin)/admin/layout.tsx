import Link from "next/link"
import { redirect } from "next/navigation"
import { AdminDesktopNavigation, AdminMobileNavigation } from "./admin-navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?next=%2Fadmin")

  const { data: adminRole, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()

  if (error || adminRole?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You need admin privileges to access this page.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm underline">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:flex">
      <AdminDesktopNavigation />
      <div className="min-w-0 flex-1">
        <AdminMobileNavigation />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
