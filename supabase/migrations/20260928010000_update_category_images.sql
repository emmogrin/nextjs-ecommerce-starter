begin;

update public.categories
set
  image_storage_path = case id
    when 'cat-1' then '/images/categories/skincare.svg'
    when 'cat-2' then '/images/categories/body-care.svg'
    when 'cat-3' then '/images/categories/hair-care.svg'
    when 'cat-4' then '/images/categories/makeup.svg'
    when 'cat-6' then '/images/categories/fragrance.svg'
  end,
  image_alt = case id
    when 'cat-1' then 'Amber skincare serum with botanical leaves'
    when 'cat-2' then 'Nourishing body cream jar with soft botanicals'
    when 'cat-3' then 'Botanical hair oil bottle among green leaves'
    when 'cat-4' then 'Rose-toned makeup palette and lipstick'
    when 'cat-6' then 'Amber glass perfume bottle with botanical accents'
  end
where id in ('cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-6');

commit;
