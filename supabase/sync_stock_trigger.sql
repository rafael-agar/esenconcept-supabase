-- Función para sincronizar automáticamente el stock total del producto
-- basado en la suma del stock de sus variantes.

create or replace function sync_product_stock()
returns trigger
language plpgsql
security definer
as $$
declare
  v_product_id uuid;
begin
  -- Determinar el ID del producto afectado
  if (TG_OP = 'DELETE') then
    v_product_id := OLD.product_id;
  else
    v_product_id := NEW.product_id;
  end if;

  -- Actualizar el stock en la tabla products
  update products
  set stock = (
    select coalesce(sum(stock), 0)
    from product_variants
    where product_id = v_product_id
  )
  where id = v_product_id;
  
  return null;
end;
$$;

-- Crear el trigger que se dispara al cambiar las variantes
drop trigger if exists on_variant_change on product_variants;

create trigger on_variant_change
after insert or update or delete on product_variants
for each row execute function sync_product_stock();
