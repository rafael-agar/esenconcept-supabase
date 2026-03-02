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
  v_quantity int;
  v_color text;
  v_size text;
begin
  for item in select * from jsonb_array_elements(items)
  loop
    v_product_id := (item->>'id')::uuid;
    v_quantity := (item->>'quantity')::int;
    v_color := item->>'selectedColor';
    v_size := item->>'selectedSize';

    -- 1. Actualizar stock en product_variants si existen color y talla
    -- Nota: Verificamos si color y talla no son nulos y no son strings vacíos o 'undefined'
    if v_color is not null and v_color <> '' and v_size is not null and v_size <> '' then
      update product_variants
      set stock = stock - v_quantity
      where product_id = v_product_id
      and color = v_color
      and size = v_size;
    end if;

    -- 2. Actualizar stock general en products
    -- Esto es importante para productos sin variantes o para mantener el total sincronizado
    update products
    set stock = stock - v_quantity
    where id = v_product_id;
    
  end loop;
end;
$$;
