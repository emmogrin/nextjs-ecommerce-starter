"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { siteConfig } from "@/lib/config"
import { formatPrice } from "@/lib/utils"

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const announcement = siteConfig.announcement ||
    `Free delivery on orders over ${formatPrice(siteConfig.freeShippingThreshold)}`

  useEffect(() => {
    setMounted(true)
    const stored = sessionStorage.getItem("announcement-dismissed")
    if (stored === "true") setDismissed(true)
  }, [])

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem("announcement-dismissed", "true")
  }

  if (!mounted || dismissed) return null

  return (
    <div role="region" aria-label="Store announcement" className="relative bg-foreground py-2.5 pl-4 pr-12 text-center text-xs font-medium text-background sm:text-sm">
      <p>{announcement}</p>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-background/70 transition-colors hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
        aria-label="Dismiss delivery announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
