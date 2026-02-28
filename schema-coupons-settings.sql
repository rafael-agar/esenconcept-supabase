-- ==========================================
-- TABLA DE CUPONES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percentage NUMERIC NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Cupones
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Políticas para Cupones
-- Todos pueden ver los cupones (para validarlos en el checkout)
CREATE POLICY "Coupons are viewable by everyone" ON public.coupons FOR SELECT USING (true);

-- Solo admins pueden crear, editar o borrar
CREATE POLICY "Only admins can insert coupons" ON public.coupons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Only admins can update coupons" ON public.coupons FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Only admins can delete coupons" ON public.coupons FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==========================================
-- TABLA DE CONFIGURACIÓN (SETTINGS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT, -- Usamos TEXT para flexibilidad (guardamos números como strings)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Políticas para Settings
CREATE POLICY "Settings are viewable by everyone" ON public.settings FOR SELECT USING (true);

CREATE POLICY "Only admins can insert settings" ON public.settings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Only admins can update settings" ON public.settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Only admins can delete settings" ON public.settings FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Insertar valores por defecto para settings (si no existen)
INSERT INTO public.settings (key, value) VALUES 
('free_shipping_threshold', '100'),
('base_shipping_cost', '6')
ON CONFLICT (key) DO NOTHING;
