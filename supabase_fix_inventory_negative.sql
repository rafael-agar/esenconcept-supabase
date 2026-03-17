-- Actualizar la función update_inventory para evitar errores de stock negativo y mantener sincronía
CREATE OR REPLACE FUNCTION update_inventory(items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity int;
  v_has_variants boolean;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    v_product_id := (item->>'id')::uuid;
    v_variant_id := (item->>'variantId')::uuid;
    v_quantity := (item->>'quantity')::int;

    -- 1. Actualizar stock en variantes
    IF v_variant_id IS NOT NULL THEN
      UPDATE product_variants
      SET stock = GREATEST(0, stock - v_quantity)
      WHERE id = v_variant_id;
    ELSIF item->>'selectedColor' IS NOT NULL AND item->>'selectedColor' <> '' 
          AND item->>'selectedSize' IS NOT NULL AND item->>'selectedSize' <> '' THEN
      UPDATE product_variants
      SET stock = GREATEST(0, stock - v_quantity)
      WHERE product_id = v_product_id
      AND color = item->>'selectedColor'
      AND size = item->>'selectedSize';
    END IF;

    -- 2. Verificar si el producto tiene variantes
    SELECT EXISTS (SELECT 1 FROM product_variants WHERE product_id = v_product_id) INTO v_has_variants;

    -- 3. Actualizar stock general en products
    IF v_has_variants THEN
      -- Si tiene variantes, el stock general debe ser la suma de todas sus variantes
      UPDATE products
      SET stock = (SELECT COALESCE(SUM(stock), 0) FROM product_variants WHERE product_id = v_product_id)
      WHERE id = v_product_id;
    ELSE
      -- Si no tiene variantes, restamos directamente del stock general
      UPDATE products
      SET stock = GREATEST(0, stock - v_quantity)
      WHERE id = v_product_id;
    END IF;
    
  END LOOP;
END;
$$;
