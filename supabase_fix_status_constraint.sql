-- 1. Eliminar la restricción actual (si existe)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Actualizar cualquier estado inválido a 'Pendiente' para que cumpla con la nueva regla
-- Esto corrige el error que estás viendo
UPDATE public.orders
SET status = 'Pendiente'
WHERE status NOT IN ('Pendiente', 'Pago Aprobado', 'Enviado', 'Entregado', 'Cancelado');

-- 3. Agregar la nueva restricción con los estados permitidos
ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check
CHECK (status IN ('Pendiente', 'Pago Aprobado', 'Enviado', 'Entregado', 'Cancelado'));
