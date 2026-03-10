-- Add color and size columns to order_items table to store product variations
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size TEXT;

-- Update existing records to have null if they didn't have variations (already default)
