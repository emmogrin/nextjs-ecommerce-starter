-- Initial Radiant Identity catalog data, generated from src/data/products.json.

-- Variant prices are copied as integer NGN kobo; this seed does not convert prices.

-- Local product image URLs are retained inside unique demo-local metadata tokens.

-- No Storage objects, product_links, or user_roles are created by this seed.

begin;

insert into public.brands (id, name, slug, description, is_active)
values
  ('brand-1', 'Volt Audio', 'volt-audio', 'Premium audio equipment designed for audiophiles and everyday listeners alike. Volt Audio combines cutting-edge technology with timeless design.', false),
  ('brand-2', 'Luma Home', 'luma-home', 'Modern home goods that blend form and function. Luma Home creates pieces that elevate your space without overwhelming it.', false),
  ('brand-3', 'Everlane Basics', 'everlane-basics', 'Radically transparent clothing made from premium organic materials. Simple, well-made basics you can feel good about wearing.', false),
  ('brand-4', 'Nomad Goods', 'nomad-goods', 'Travel-ready accessories built from full-grain leather and waxed canvas. Designed to age beautifully and go everywhere you do.', false),
  ('brand-5', 'Ritual Roasters', 'ritual-roasters', 'Small-batch, ethically sourced coffee and tea from independent farms. Every cup tells a story of craftsmanship and care.', false),
  ('brand-6', 'Appointed Co.', 'appointed-co', 'Thoughtfully designed stationery and desk accessories. Made in small batches with quality materials that inspire creativity.', false),
  ('brand-radiant-identity', 'Radiant Identity', 'radiant-identity', 'Temporary storefront brand for demo catalog products awaiting real partner brands.', true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.categories (id, parent_id, name, slug, description, image_storage_path, image_alt, sort_order, is_active)
values
  ('cat-1', null, 'Skincare', 'skincare', 'Headphones, speakers, and everyday tech essentials. Built to last and designed to sound great wherever you go.', '/images/categories/skincare.svg', 'Amber skincare serum with botanical leaves', 1, true),
  ('cat-2', null, 'Body Care', 'body-care', 'Comfortable, well-made basics for every day. Organic fabrics and relaxed fits that look good and feel even better.', '/images/categories/body-care.svg', 'Nourishing body cream jar with soft botanicals', 2, true),
  ('cat-3', null, 'Hair Care', 'hair-care', 'Thoughtful pieces for your living space. From lighting to textiles, everything you need to make a house feel like home.', '/images/categories/hair-care.svg', 'Botanical hair oil bottle among green leaves', 3, true),
  ('cat-4', null, 'Makeup', 'makeup', 'Bags, wallets, and everyday carry. Crafted from premium materials that age beautifully with use.', '/images/categories/makeup.svg', 'Rose-toned makeup palette and lipstick', 4, true),
  ('cat-6', null, 'Fragrance', 'fragrance', 'Coffee, tea, and specialty treats. Sourced from small producers who care about quality and sustainability.', '/images/categories/fragrance.svg', 'Amber glass perfume bottle with botanical accents', 6, true)
on conflict (id) do update set
  parent_id = excluded.parent_id,
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  image_storage_path = excluded.image_storage_path,
  image_alt = excluded.image_alt,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.categories (id, parent_id, name, slug, description, image_storage_path, image_alt, sort_order, is_active)
values
  ('cat-1-1', 'cat-1', 'Cleansers', 'cleansers', 'Over-ear, on-ear, and in-ear headphones for every listening style. From noise-cancelling to open-back, find your perfect pair.', null, '', 1, true),
  ('cat-1-2', 'cat-1', 'Serums', 'serums', 'Portable and desktop speakers that deliver rich, room-filling sound. Built for home, travel, and everywhere in between.', null, '', 2, true),
  ('cat-1-3', 'cat-1', 'Moisturizers', 'moisturizers', 'Wireless chargers, cables, and tech accessories to keep your devices powered and organized.', null, '', 3, true)
on conflict (id) do update set
  parent_id = excluded.parent_id,
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  image_storage_path = excluded.image_storage_path,
  image_alt = excluded.image_alt,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.products (id, brand_id, name, slug, description, body, status, tags, rating, review_count, featured, created_at, updated_at)
values
  ('prod-1', 'brand-radiant-identity', 'Radiant Gentle Face Cleanser', 'radiant-gentle-face-cleanser', 'A gentle daily cleanser that removes makeup, sunscreen, and impurities without stripping skin.', '<h2>Immersive Sound, Anywhere</h2><p>Experience studio-quality audio whether youre commuting, working, or relaxing at home. Our wireless over-ear headphones combine premium 40mm drivers with advanced noise-cancelling technology to deliver rich, balanced sound across every frequency.</p><h3>Key Features</h3><ul><li><strong>Active Noise Cancellation</strong> — Three ANC modes adapt to your environment</li><li><strong>30-Hour Battery</strong> — Full day of listening on a single charge</li><li><strong>Memory Foam Cushions</strong> — Designed for extended wear</li><li><strong>Bluetooth 5.3</strong> — Stable connection up to 30 feet</li></ul><h3>Built to Last</h3><p>Constructed with aircraft-grade aluminum and premium vegan leather, these headphones are designed to accompany you for years. Every component — from the adjustable headband to the swiveling ear cups — has been engineered for durability and comfort.</p><blockquote>These are hands-down the most comfortable headphones Ive ever owned. The sound is crisp, the noise cancellation is incredible, and I can wear them all day without any discomfort.</blockquote><h3>Whats in the Box</h3><ul><li>Wireless headphones</li><li>Premium carrying case</li><li>USB-C charging cable</li><li>3.5mm audio cable</li><li>Quick start guide</li></ul>', 'active', array['wireless', 'noise-cancelling', 'bluetooth']::text[], 4.5, 128, true, '2025-01-15T10:00:00Z', '2025-01-15T10:00:00Z'),
  ('prod-2', 'brand-radiant-identity', 'Dewdrop Hydrating Serum', 'dewdrop-hydrating-serum', 'A lightweight serum that layers easily to leave skin feeling hydrated, smooth, and refreshed.', '<h2>Thoughtful Light for Your Workspace</h2><p>A desk lamp designed to disappear into the background until you need it. The adjustable arm and tunable color temperature mean you can shape your lighting for focused work, relaxed reading, or video calls.</p><h3>Features</h3><ul><li>Three brightness levels</li><li>Warm-to-cool color temperature dial</li><li>Flexible aluminum arm</li><li>Weighted base for stability</li><li>USB-C powered</li></ul><h3>Design</h3><p>The minimalist silhouette fits any workspace — home office, studio, or shared desk. Available in silver or matte black.</p>', 'active', array['lighting', 'desk', 'minimal']::text[], 4.8, 64, true, '2025-01-20T10:00:00Z', '2025-01-20T10:00:00Z'),
  ('prod-3', 'brand-radiant-identity', 'Cloudsoft Body Lotion', 'cloudsoft-body-lotion', 'A fast-absorbing body lotion that softens dry skin with a comfortable, non-greasy finish.', '<h2>The Perfect Everyday Tee</h2><p>We spent two years sourcing the right organic cotton and perfecting the fit. The result is a t-shirt that feels like a favorite from day one.</p><h3>Details</h3><ul><li>100% GOTS-certified organic cotton</li><li>Heavyweight 6.5oz fabric</li><li>Garment-dyed for a lived-in feel</li><li>Pre-shrunk</li><li>Side seams for a clean drape</li></ul><h3>Care</h3><p>Machine wash cold, tumble dry low. The more you wash it, the better it gets.</p>', 'active', array['organic', 'cotton', 'basics']::text[], 4.3, 256, true, '2025-02-01T10:00:00Z', '2025-02-01T10:00:00Z'),
  ('prod-4', 'brand-radiant-identity', 'Daily Dew Moisturizer', 'daily-dew-moisturizer', 'A nourishing everyday moisturizer that helps skin feel supple and comfortably hydrated.', null, 'active', array['coffee', 'ceramic', 'handmade']::text[], 4.7, 89, true, '2025-02-10T10:00:00Z', '2025-02-10T10:00:00Z'),
  ('prod-5', 'brand-radiant-identity', 'Everyday Glow Lip Balm', 'everyday-glow-lip-balm', 'A smooth, conditioning balm that adds a soft hint of color and a natural-looking sheen.', null, 'active', array['leather', 'travel', 'wallet']::text[], 4.6, 47, false, '2025-02-15T10:00:00Z', '2025-02-15T10:00:00Z'),
  ('prod-6', 'brand-radiant-identity', 'Botanical Scalp & Hair Oil', 'botanical-scalp-hair-oil', 'A lightweight finishing oil that adds shine and smooths dry ends without weighing hair down.', null, 'active', array['coffee', 'organic', 'fair-trade']::text[], 4.9, 312, false, '2025-03-01T10:00:00Z', '2025-03-01T10:00:00Z'),
  ('prod-7', 'brand-radiant-identity', 'Radiant Mist Hydrating Toner', 'radiant-mist-hydrating-toner', 'A refreshing facial mist that gives skin a quick boost of hydration before moisturizer or throughout the day.', null, 'active', array['bluetooth', 'waterproof', 'portable']::text[], 4.4, 93, false, '2025-03-05T10:00:00Z', '2025-03-05T10:00:00Z'),
  ('prod-8', 'brand-radiant-identity', 'Silkening Hand & Body Cream', 'silkening-hand-body-cream', 'A rich but quick-absorbing cream to soften hands and dry areas with lasting comfort.', null, 'active', array['linen', 'home-decor', 'pillow']::text[], 4.2, 71, false, '2025-03-10T10:00:00Z', '2025-03-10T10:00:00Z'),
  ('prod-9', 'brand-radiant-identity', 'Glow Ritual Travel Skincare Set', 'glow-ritual-travel-skincare-set', 'A travel-ready collection of skincare essentials for cleansing, hydrating, and moisturizing on the go.', null, 'active', array['bag', 'travel', 'canvas']::text[], 4.8, 34, true, '2025-03-15T10:00:00Z', '2025-03-15T10:00:00Z'),
  ('prod-10', 'brand-radiant-identity', 'Radiant Amber Eau de Parfum', 'radiant-amber-eau-de-parfum', 'A warm, softly radiant fragrance with smooth amber notes for an elegant everyday signature.', null, 'active', array['notebook', 'stationery', 'writing']::text[], 4.5, 185, false, '2025-03-20T10:00:00Z', '2025-03-20T10:00:00Z'),
  ('prod-11', 'brand-radiant-identity', 'Soft Hold Brow & Lash Gel', 'soft-hold-brow-lash-gel', 'A clear, flexible gel that tidies brows and defines lashes for a polished everyday look.', null, 'active', array['merino', 'wool', 'winter']::text[], 4.6, 58, false, '2025-04-01T10:00:00Z', '2025-04-01T10:00:00Z'),
  ('prod-12', 'brand-radiant-identity', 'Calm & Restore Overnight Mask', 'calm-restore-overnight-mask', 'A comforting overnight mask that leaves skin feeling soft and replenished by morning.', null, 'active', array['candle', 'soy', 'home-fragrance']::text[], 4.7, 142, false, '2025-04-05T10:00:00Z', '2025-04-05T10:00:00Z'),
  ('prod-13', 'brand-radiant-identity', 'Golden Hour Shimmer Body Oil', 'golden-hour-shimmer-body-oil', 'A lightweight body oil with a subtle glow that smooths skin and adds a luminous finish.', null, 'active', array['matcha', 'tea', 'japanese']::text[], 4.3, 27, false, '2025-04-08T10:00:00Z', '2025-04-08T10:00:00Z'),
  ('prod-14', 'brand-radiant-identity', 'Radiant Beam Facial Massage Tool', 'radiant-beam-facial-massage-tool', 'A simple facial massage tool designed to support a relaxing, spa-like step in your skincare routine.', null, 'active', array['wireless', 'charger', 'tech']::text[], 4.4, 203, false, '2025-04-10T10:00:00Z', '2025-04-10T10:00:00Z')
on conflict (id) do update set
  brand_id = excluded.brand_id,
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  body = excluded.body,
  status = excluded.status,
  tags = excluded.tags,
  rating = excluded.rating,
  review_count = excluded.review_count,
  featured = excluded.featured,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.product_variants (id, product_id, sku, name, options, price_kobo, compare_at_price_kobo, quantity, track_inventory, allow_backorder, weight, dimensions)
values
  ('var-1-1', 'prod-1', 'RGFC-100', '100 ml', '[{"name":"Size","value":"100 ml"}]'::jsonb, 800000, 1000000, 50, true, false, null, null),
  ('var-1-2', 'prod-1', 'RGFC-200', '200 ml', '[{"name":"Size","value":"200 ml"}]'::jsonb, 800000, 1000000, 35, true, false, null, null),
  ('var-2-1', 'prod-2', 'DHS-30', '30 ml', '[{"name":"Size","value":"30 ml"}]'::jsonb, 1250000, null, 25, true, false, null, null),
  ('var-2-2', 'prod-2', 'DHS-50', '50 ml', '[{"name":"Size","value":"50 ml"}]'::jsonb, 1250000, null, 18, true, false, null, null),
  ('var-3-1', 'prod-3', 'CBL-250', '250 ml', '[{"name":"Size","value":"250 ml"}]'::jsonb, 850000, null, 100, true, false, null, null),
  ('var-3-2', 'prod-3', 'CBL-400', '400 ml', '[{"name":"Size","value":"400 ml"}]'::jsonb, 850000, null, 80, true, false, null, null),
  ('var-3-3', 'prod-3', 'CBL-250-RF', '250 ml Refill', '[{"name":"Size","value":"250 ml"},{"name":"Format","value":"Refill"}]'::jsonb, 850000, null, 60, true, false, null, null),
  ('var-3-4', 'prod-3', 'CBL-400-RF', '400 ml Refill', '[{"name":"Size","value":"400 ml"},{"name":"Format","value":"Refill"}]'::jsonb, 850000, null, 70, true, false, null, null),
  ('var-4-1', 'prod-4', 'DDM-50', '50 ml', '[{"name":"Size","value":"50 ml"}]'::jsonb, 1150000, null, 40, true, false, null, null),
  ('var-5-1', 'prod-5', 'EGLB-WN', 'Warm Nude', '[{"name":"Shade","value":"Warm Nude"}]'::jsonb, 450000, null, 30, true, false, null, null),
  ('var-5-2', 'prod-5', 'EGLB-DC', 'Deep Cocoa', '[{"name":"Shade","value":"Deep Cocoa"}]'::jsonb, 450000, null, 22, true, false, null, null),
  ('var-6-1', 'prod-6', 'BSHO-30', '30 ml', '[{"name":"Size","value":"30 ml"}]'::jsonb, 950000, null, 200, true, true, null, null),
  ('var-6-2', 'prod-6', 'BSHO-60', '60 ml', '[{"name":"Size","value":"60 ml"}]'::jsonb, 1800000, null, 80, true, true, null, null),
  ('var-7-1', 'prod-7', 'RMHT-100', '100 ml', '[{"name":"Size","value":"100 ml"}]'::jsonb, 750000, null, 45, true, false, null, null),
  ('var-7-2', 'prod-7', 'RMHT-200', '200 ml', '[{"name":"Size","value":"200 ml"}]'::jsonb, 750000, null, 30, true, false, null, null),
  ('var-8-1', 'prod-8', 'SHBC-50', '50 ml', '[{"name":"Size","value":"50 ml"}]'::jsonb, 750000, null, 60, true, false, null, null),
  ('var-8-2', 'prod-8', 'SHBC-100', '100 ml', '[{"name":"Size","value":"100 ml"}]'::jsonb, 750000, null, 40, true, false, null, null),
  ('var-9-1', 'prod-9', 'GRTSS-TR', 'Travel Set', '[{"name":"Set","value":"Travel"}]'::jsonb, 2200000, null, 15, true, false, null, null),
  ('var-10-1', 'prod-10', 'RAEDP-30', '30 ml', '[{"name":"Size","value":"30 ml"}]'::jsonb, 2400000, null, 150, true, true, null, null),
  ('var-10-2', 'prod-10', 'RAEDP-50', '50 ml', '[{"name":"Size","value":"50 ml"}]'::jsonb, 2400000, null, 90, true, true, null, null),
  ('var-11-1', 'prod-11', 'SHBLG-CLR', 'Clear', '[{"name":"Shade","value":"Clear"}]'::jsonb, 650000, null, 75, true, false, null, null),
  ('var-11-2', 'prod-11', 'SHBLG-SBR', 'Soft Brown', '[{"name":"Shade","value":"Soft Brown"}]'::jsonb, 650000, null, 55, true, false, null, null),
  ('var-12-1', 'prod-12', 'CROM-BR', 'Barrier Repair', '[{"name":"Formula","value":"Barrier Repair"}]'::jsonb, 1350000, null, 90, true, false, null, null),
  ('var-12-2', 'prod-12', 'CROM-CO', 'Calming Oat', '[{"name":"Formula","value":"Calming Oat"}]'::jsonb, 1350000, null, 65, true, false, null, null),
  ('var-12-3', 'prod-12', 'CROM-HY', 'Hydrating', '[{"name":"Formula","value":"Hydrating"}]'::jsonb, 1350000, null, 80, true, false, null, null),
  ('var-13-1', 'prod-13', 'GHSBO-GG', 'Golden Glow', '[{"name":"Finish","value":"Golden Glow"}]'::jsonb, 1150000, null, 20, true, false, null, null),
  ('var-14-1', 'prod-14', 'RBFMT-RQ', 'Rose Quartz', '[{"name":"Material","value":"Rose Quartz"}]'::jsonb, 800000, null, 120, true, false, null, null),
  ('var-14-2', 'prod-14', 'RBFMT-JD', 'Jade', '[{"name":"Material","value":"Jade"}]'::jsonb, 800000, null, 85, true, false, null, null)
on conflict (id) do update set
  product_id = excluded.product_id,
  sku = excluded.sku,
  name = excluded.name,
  options = excluded.options,
  price_kobo = excluded.price_kobo,
  compare_at_price_kobo = excluded.compare_at_price_kobo,
  quantity = excluded.quantity,
  track_inventory = excluded.track_inventory,
  allow_backorder = excluded.allow_backorder,
  weight = excluded.weight,
  dimensions = excluded.dimensions;

insert into public.product_categories (product_id, category_id, sort_order)
values
  ('prod-1', 'cat-1', 0),
  ('prod-1', 'cat-1-1', 1),
  ('prod-2', 'cat-1', 0),
  ('prod-2', 'cat-1-2', 1),
  ('prod-3', 'cat-2', 0),
  ('prod-4', 'cat-1', 0),
  ('prod-4', 'cat-1-3', 1),
  ('prod-5', 'cat-4', 0),
  ('prod-6', 'cat-3', 0),
  ('prod-7', 'cat-1', 0),
  ('prod-7', 'cat-1-2', 1),
  ('prod-8', 'cat-2', 0),
  ('prod-9', 'cat-1', 0),
  ('prod-10', 'cat-6', 0),
  ('prod-11', 'cat-4', 0),
  ('prod-12', 'cat-1', 0),
  ('prod-12', 'cat-1-3', 1),
  ('prod-13', 'cat-2', 0),
  ('prod-14', 'cat-1', 0)
on conflict (product_id, category_id) do update set
  sort_order = excluded.sort_order;

insert into public.product_images (id, product_id, variant_id, storage_path, alt, width, height, sort_order)
values
  ('img-prod-1-01', 'prod-1', null, 'demo-local/prod-1/1::/images/products/placeholder.svg', 'Illustrative placeholder; product photo coming soon', 800, 800, 0),
  ('img-prod-2-01', 'prod-2', null, 'demo-local/prod-2/1::/images/products/placeholder.svg', 'Desk lamp on workspace', 800, 800, 0),
  ('img-prod-3-01', 'prod-3', null, 'demo-local/prod-3/1::/images/products/placeholder.svg', 'Cotton t-shirt front', 800, 800, 0),
  ('img-prod-4-01', 'prod-4', null, 'demo-local/prod-4/1::/images/products/placeholder.svg', 'Pour-over coffee maker', 800, 800, 0),
  ('img-prod-5-01', 'prod-5', null, 'demo-local/prod-5/1::/images/products/placeholder.svg', 'Leather wallet closed', 800, 800, 0),
  ('img-prod-5-02', 'prod-5', null, 'demo-local/prod-5/2::/images/products/placeholder.svg', 'Leather wallet open', 800, 800, 1),
  ('img-prod-6-01', 'prod-6', null, 'demo-local/prod-6/1::/images/products/placeholder.svg', 'Coffee beans bag', 800, 800, 0),
  ('img-prod-7-01', 'prod-7', null, 'demo-local/prod-7/1::/images/products/placeholder.svg', 'Bluetooth speaker', 800, 800, 0),
  ('img-prod-8-01', 'prod-8', null, 'demo-local/prod-8/1::/images/products/placeholder.svg', 'Linen throw pillow', 800, 800, 0),
  ('img-prod-9-01', 'prod-9', null, 'demo-local/prod-9/1::/images/products/placeholder.svg', 'Canvas weekender bag', 800, 800, 0),
  ('img-prod-10-01', 'prod-10', null, 'demo-local/prod-10/1::/images/products/placeholder.svg', 'Dot grid notebook', 800, 800, 0),
  ('img-prod-11-01', 'prod-11', null, 'demo-local/prod-11/1::/images/products/placeholder.svg', 'Merino wool beanie', 800, 800, 0),
  ('img-prod-12-01', 'prod-12', null, 'demo-local/prod-12/1::/images/products/placeholder.svg', 'Soy candle', 800, 800, 0),
  ('img-prod-13-01', 'prod-13', null, 'demo-local/prod-13/1::/images/products/placeholder.svg', 'Matcha set', 800, 800, 0),
  ('img-prod-14-01', 'prod-14', null, 'demo-local/prod-14/1::/images/products/placeholder.svg', 'Wireless charging pad', 800, 800, 0)
on conflict (id) do update set
  product_id = excluded.product_id,
  variant_id = excluded.variant_id,
  storage_path = excluded.storage_path,
  alt = excluded.alt,
  width = excluded.width,
  height = excluded.height,
  sort_order = excluded.sort_order;

delete from public.product_images where id = 'img-prod-1-02';

commit;

