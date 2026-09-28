// Re-export the JSON-backed repositories as the default implementations.
// To swap backends (database, CMS, API), implement the same interfaces
// and change these exports.

export { supabaseProductRepository as productRepository } from "./supabase-product-repository"
export { supabaseCategoryRepository as categoryRepository } from "./supabase-category-repository"
export { supabaseBrandRepository as brandRepository } from "./supabase-brand-repository"
export { jsonPageRepository as pageRepository } from "./json-page-repository"
export { jsonBlogRepository as blogRepository } from "./json-blog-repository"
