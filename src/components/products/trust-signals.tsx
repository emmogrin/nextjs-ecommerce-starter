import { MessageCircle, Shield, Truck } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { siteConfig } from "@/lib/config"

export function TrustSignals() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Truck className="h-4 w-4" />
        <span>Free delivery on orders over {formatPrice(siteConfig.freeShippingThreshold)}</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <MessageCircle className="h-4 w-4" />
        <span>Order issues? We are here to help</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Secure checkout</span>
      </div>
    </div>
  )
}
