-- Función para actualizar el inventario después de una compra
-- Ejecuta este script en el Editor SQL de Supabase

create or replace function update_inventory(items jsonb)
returns void
language plpgsql
security definer
as $$
declare
  item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity int;
begin
  for item in select * from jsonb_array_elements(items)
  loop
    v_product_id := (item->>'id')::uuid;
    v_variant_id := (item->>'variantId')::uuid;
    v_quantity := (item->>'quantity')::int;

    -- 1. Actualizar stock en product_variants si se proporciona variantId
    if v_variant_id is not null then
      update product_variants
      set stock = stock - v_quantity
      where id = v_variant_id;
    -- 2. Si no hay variantId pero hay color/talla (retrocompatibilidad)
    elsif item->>'selectedColor' is not null and item->>'selectedColor' <> '' 
          and item->>'selectedSize' is not null and item->>'selectedSize' <> '' then
      update product_variants
      set stock = stock - v_quantity
      where product_id = v_product_id
      and color = item->>'selectedColor'
      and size = item->>'selectedSize';
    end if;

    -- 3. Actualizar stock general en products
    -- Importante: Si el producto tiene variantes, el stock total se recalcula en el frontend,
    -- pero actualizamos la tabla products por consistencia.
    update products
    set stock = stock - v_quantity
    where id = v_product_id;
    
  end loop;
end;
$$;
