"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { HelpCircle, Mail, MessageCircle, Package } from "lucide-react"

export function CustomerCare() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)

  useEffect(() => {
    const footer = document.querySelector("footer")
    if (!footer || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFooterVisible(entry.isIntersecting)
        if (entry.isIntersecting) setOpen(false)
      },
      { rootMargin: "0px 0px -48px 0px" }
    )

    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            aria-label="Open customer care"
            className={cn(
              "fixed bottom-6 right-6 z-50 h-12 gap-2 rounded-full bg-white px-3 shadow-lg transition-all duration-200 hover:bg-neutral-50 sm:px-4",
              footerVisible
                ? "pointer-events-none translate-y-4 opacity-0"
                : "translate-y-0 opacity-100"
            )}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Customer Care</span>
          </Button>
        }
      />
      <DropdownMenuContent side="top" align="end" className="min-w-56">
        <DropdownMenuItem onClick={() => router.push("/account/orders")}>
          <Package className="mr-2 h-4 w-4" />
          Report an order issue
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/contact")}>
          <Mail className="mr-2 h-4 w-4" />
          Contact us
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/faq")}>
          <HelpCircle className="mr-2 h-4 w-4" />
          FAQs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
