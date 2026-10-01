// ============================================================================
// Store Configuration — Single source of truth for all store-wide settings.
// Edit this file to customize the store name, contact info, social links, etc.
// ============================================================================

export const siteConfig = {
  // Branding
  name: "Radiant Identity",
  tagline: "Reveal your radiant identity.",
  description:
    "Radiant Identity is a curated destination for premium skincare and beauty essentials — thoughtfully selected to help you look, feel, and live radiant.",

  // Announcement bar (set to "" to hide)
  announcement: "",

  // URLs
  url: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",

  // Contact
  contact: {
    email: "yourradiantidentity@gmail.com",
    phone: "",
    address: {
      street: "",
      suite: "",
      city: "",
      state: "",
      zip: "",
    },
  },

  // Social links (set to "" to hide)
  social: {
    twitter: "",
    instagram: "https://www.instagram.com/theradiantgirly?stkn=Z3RocTc0bTRscmc2&utm_source=qr",
    facebook: "",
    youtube: "",
    tiktok: "https://www.tiktok.com/@_theradiantgirly?_r=1&_t=ZS-9A58iM7S5XV",
  },

  // Shipping
  freeShippingThreshold: 30000000, // in kobo (300,000)
  taxRate: 0.08, // 8%

  // Currency & locale
  currency: "NGN",
  locale: "en-NG",

  // Legal
  copyrightYear: new Date().getFullYear(),
} as const

export type SiteConfig = typeof siteConfig
