// Re-export the active repository implementations.
// To swap a backend (database, CMS, API), implement the same interface
// and change the export here.

export { supabaseProductRepository as productRepository } from "./supabase-product-repository"
export { supabaseCategoryRepository as categoryRepository } from "./supabase-category-repository"
export { supabaseBrandRepository as brandRepository } from "./supabase-brand-repository"
export { jsonPageRepository as pageRepository } from "./json-page-repository"
export { supabaseBlogRepository as blogRepository } from "./supabase-blog-repository"
