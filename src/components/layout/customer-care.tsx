"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HelpCircle, Mail, MessageCircle, Package } from "lucide-react"

export function CustomerCare() {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            aria-label="Open customer care"
            className="fixed bottom-6 right-6 z-50 h-12 gap-2 rounded-full bg-white px-3 shadow-lg hover:bg-neutral-50 sm:px-4"
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
