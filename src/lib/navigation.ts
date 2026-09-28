export interface NavItem {
  name: string
  href: string
}

export interface NavSection {
  label: string
  items: NavItem[]
}

// Single source of truth for all navigation across desktop header,
// mobile menu, and anywhere else. Edit this one file to update all menus.

export const shopLinks: NavItem[] = [
  { name: "Skincare", href: "/skincare" },
  { name: "Body Care", href: "/body-care" },
  { name: "Hair Care", href: "/hair-care" },
  { name: "Makeup", href: "/makeup" },
  { name: "Fragrance", href: "/fragrance" },
]

export const accountLinks: NavItem[] = [
  { name: "My Account", href: "/account" },
  { name: "Wishlist", href: "/wishlist" },
  { name: "Orders", href: "/account/orders" },
]

export const infoLinks: NavItem[] = [
  { name: "All Brands", href: "/brands" },
  { name: "Blog", href: "/blog" },
  { name: "Pages", href: "/pages" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "FAQ", href: "/faq" },
]

export const mobileMenuSections: NavSection[] = [
  { label: "Shop", items: shopLinks },
  { label: "Account", items: accountLinks },
  { label: "Info", items: infoLinks },
]
