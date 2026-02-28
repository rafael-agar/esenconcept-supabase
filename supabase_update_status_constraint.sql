-- Drop the existing check constraint
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new check constraint with the updated values
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('Pendiente', 'Pago Aprobado', 'Enviado', 'Entregado', 'Cancelado'));

-- Optional: Update existing rows that might have invalid statuses to a default valid one if needed
-- UPDATE public.orders SET status = 'Pendiente' WHERE status NOT IN ('Pendiente', 'Pago Aprobado', 'Enviado', 'Entregado', 'Cancelado');
