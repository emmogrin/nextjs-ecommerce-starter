"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  Menu,
  Newspaper,
  Package,
  Tag,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Boxes },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Brands", href: "/admin/brands", icon: Tag },
  { name: "Blog", href: "/admin/blog", icon: Newspaper },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Customers", href: "/admin/customers", icon: Users },
]

function isActivePath(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)
}

function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin navigation" className="space-y-1 p-4">
      {adminNav.map((item) => {
        const active = isActivePath(pathname, item.href)
        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white hover:text-foreground"
            )}
          >
            <item.icon aria-hidden="true" className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminDesktopNavigation() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-neutral-50 lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="text-lg font-semibold">
          Admin
        </Link>
      </div>
      <AdminNavLinks />
      <div className="mt-auto border-t p-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Store
        </Link>
      </div>
    </aside>
  )
}

export function AdminMobileNavigation() {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-neutral-50 px-4 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Open admin menu">
              <Menu aria-hidden="true" />
            </Button>
          }
        />
        <SheetContent side="left" className="p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Admin menu</SheetTitle>
          </SheetHeader>
          <AdminNavLinks onNavigate={() => setOpen(false)} />
          <div className="mt-auto border-t p-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Back to Store
            </Link>
          </div>
        </SheetContent>
      </Sheet>
      <Link href="/admin" className="font-semibold">
        Admin
      </Link>
    </header>
  )
}
