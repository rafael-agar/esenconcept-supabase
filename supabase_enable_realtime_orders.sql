-- Enable realtime for orders table
-- This is required for the client to receive updates when order status changes
BEGIN;
  -- Check if the table is already in the publication to avoid errors
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
  END
  $$;
COMMIT;
