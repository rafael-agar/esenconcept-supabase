-- Add gift columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_details JSONB;

-- Ensure RLS policies allow access to these columns (usually automatic for owner, but good to verify)
-- No specific policy needed for new columns if the row policy covers the table.
