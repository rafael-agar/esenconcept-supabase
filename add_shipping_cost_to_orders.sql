-- Add shipping_cost column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0;

-- Add document_id column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_id TEXT;

-- Comment on the columns for clarity
COMMENT ON COLUMN public.orders.shipping_cost IS 'Costo de envío de la orden';
COMMENT ON COLUMN public.profiles.document_id IS 'Cédula o ID del cliente';
