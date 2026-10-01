-- Replace legacy starter-template copy with Radiant Identity beauty copy.
-- Updates only visible descriptions; names, slugs, IDs, and structure are unchanged.

begin;

update public.brands
set description = 'Radiant Identity is a curated beauty and skincare destination. We thoughtfully select premium essentials to help you look, feel, and live radiant.'
where id = 'brand-radiant-identity';

update public.categories
set description = case id
  when 'cat-1'   then 'Thoughtfully selected cleansers, serums, and moisturizers to keep your skin healthy, hydrated, and glowing.'
  when 'cat-2'   then 'Nourishing creams, lotions, and oils to soften, smooth, and care for your skin from head to toe.'
  when 'cat-3'   then 'Gentle oils and treatments to nourish your scalp, smooth your strands, and reveal healthy, shiny hair.'
  when 'cat-4'   then 'Everyday essentials to enhance your natural features with soft, flattering color and a radiant finish.'
  when 'cat-6'   then 'Warm, elegant scents to complete your ritual and leave a lasting impression.'
  when 'cat-1-1' then 'Gentle cleansers that remove makeup, sunscreen, and impurities without stripping your skin.'
  when 'cat-1-2' then 'Lightweight, targeted serums that deliver hydration and daily care to keep skin looking its best.'
  when 'cat-1-3' then 'Comforting moisturizers that lock in hydration and leave skin feeling soft and supple.'
end
where id in ('cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-6', 'cat-1-1', 'cat-1-2', 'cat-1-3');

commit;
