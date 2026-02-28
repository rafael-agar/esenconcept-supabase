-- Add payment_details column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_details JSONB;

-- Add gift_details column if it doesn't exist (just in case)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS gift_details JSONB;

-- Add is_gift column if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT FALSE;

-- Refresh the schema cache (Supabase does this automatically usually, but good to know)
NOTIFY pgrst, 'reload schema';
