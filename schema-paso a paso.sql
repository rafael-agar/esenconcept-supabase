-- ==========================================
-- 1. TABLA DE PERFILES (Extiende auth.users)
-- ==========================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. TABLA DE CATEGORÍAS
-- ==========================================
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. TABLA DE PRODUCTOS
-- ==========================================
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. TABLA DE CARRITO (Para persistir el carrito en la BD)
-- ==========================================
CREATE TABLE public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id) -- Un usuario no puede tener el mismo producto dos veces en el carrito (se suma la cantidad)
);

-- ==========================================
-- 5. TABLA DE ÓRDENES (Pedidos)
-- ==========================================
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_address TEXT NOT NULL,
  payment_method TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 6. TABLA DE DETALLES DE ÓRDENES
-- ==========================================
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0), -- Guardamos el precio al momento de la compra
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 7. TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ==========================================

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar el trigger de updated_at a las tablas relevantes
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear un perfil automáticamente cuando un usuario se registra en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se dispara al crear un usuario en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 8. SEGURIDAD (Row Level Security - RLS)
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para Categorías (Todos pueden ver, solo admin puede modificar)
CREATE POLICY "Categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
CREATE POLICY "Only admins can insert categories" ON public.categories FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can update categories" ON public.categories FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can delete categories" ON public.categories FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Políticas para Productos (Todos pueden ver, solo admin puede modificar)
CREATE POLICY "Products are viewable by everyone." ON public.products FOR SELECT USING (true);
CREATE POLICY "Only admins can insert products" ON public.products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can update products" ON public.products FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can delete products" ON public.products FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Políticas para Carrito (Solo el dueño puede ver y modificar su carrito)
CREATE POLICY "Users can view their own cart items." ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cart items." ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart items." ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cart items." ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Órdenes (Usuarios ven las suyas, admin ve todas)
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can insert their own orders." ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Only admins can update orders" ON public.orders FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Políticas para Detalles de Órdenes
CREATE POLICY "Users can view their own order items." ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can insert their own order items." ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- ==========================================
-- 9. CONFIGURACIÓN DE STORAGE (Imágenes)
-- ==========================================

-- -- Crear un bucket público llamado 'product-images'
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('product-images', 'product-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS en la tabla de objetos de storage (por si no lo está)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política 1: Cualquier persona puede ver/descargar las imágenes
CREATE POLICY "Imágenes públicas para todos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Política 2: Solo los administradores pueden subir (INSERT) imágenes
CREATE POLICY "Solo admins pueden subir imágenes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Política 3: Solo los administradores pueden actualizar (UPDATE) imágenes
CREATE POLICY "Solo admins pueden actualizar imágenes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Política 4: Solo los administradores pueden borrar (DELETE) imágenes
CREATE POLICY "Solo admins pueden borrar imágenes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ===========================
-- #ARREGLANDO RLS DE BUCKET#
-- ===========================

-- Política 1: Cualquier persona puede ver/descargar las imágenes
CREATE POLICY "Imágenes públicas para todos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Política 2: Solo los administradores pueden subir (INSERT) imágenes
CREATE POLICY "Solo admins pueden subir imágenes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Política 3: Solo los administradores pueden actualizar (UPDATE) imágenes
CREATE POLICY "Solo admins pueden actualizar imágenes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Política 4: Solo los administradores pueden borrar (DELETE) imágenes
CREATE POLICY "Solo admins pueden borrar imágenes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);



-- ===================
-- Este script crea la tabla de configuración de tallas y actualiza la estructura de variantes para soportar códigos de color.
-- ===================

-- 1. Tabla de Configuración de Tallas
CREATE TABLE IF NOT EXISTS public.sizes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- Ej: 'S', 'M', 'L', '38', '40'
    order_index INTEGER DEFAULT 0, -- Para ordenar las tallas (S antes que M)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar tallas por defecto (puedes cambiarlas luego)
INSERT INTO public.sizes (name, order_index) VALUES 
('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5)
ON CONFLICT (name) DO NOTHING;

-- 2. Tabla de Variantes Actualizada con Código de Color
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    color TEXT NOT NULL,           -- Nombre: "Rojo Pasión"
    color_code TEXT NOT NULL,      -- Hex: "#FF0000"
    size TEXT NOT NULL,            -- Nombre de la talla (debe coincidir con public.sizes.name)
    stock INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10, 2),
    sku TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Políticas de Seguridad (RLS)
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública de tallas" ON public.sizes FOR SELECT USING (true);
CREATE POLICY "Admin gestiona tallas" ON public.sizes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública de variantes" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admin gestiona variantes" ON public.product_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =========
-- AGREGANDO COLUMNA para ofertas y etiqueta "Nuevo" en la tabla de productos

-- =========

-- Agregar columnas para ofertas y etiqueta "Nuevo" en la tabla de productos
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sale BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2);


-- ==============
-- TABLA DE IMAGENES ADICIONALES
-- ==============

-- 1. Tabla para imágenes adicionales de productos
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Seguridad
CREATE POLICY "Imágenes de productos visibles para todos" 
ON public.product_images FOR SELECT USING (true);

CREATE POLICY "Admins pueden gestionar imágenes de productos" 
ON public.product_images FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ====================
-- CRUD DE CATEGORIAS 
-- ====================

-- 1. Asegurar que la tabla existe (ya debería existir por el esquema inicial)
-- CREATE TABLE IF NOT EXISTS public.categories ...

-- 2. Habilitar RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Seguridad
DROP POLICY IF EXISTS "Categorías visibles para todos" ON public.categories;
CREATE POLICY "Categorías visibles para todos" 
ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins pueden gestionar categorías" ON public.categories;
CREATE POLICY "Admins pueden gestionar categorías" 
ON public.categories FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ===================
-- CUPONS 
-- ===================

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
DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON public.coupons;
CREATE POLICY "Coupons are viewable by everyone" ON public.coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can insert coupons" ON public.coupons;
CREATE POLICY "Only admins can insert coupons" ON public.coupons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Only admins can update coupons" ON public.coupons;
CREATE POLICY "Only admins can update coupons" ON public.coupons FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Only admins can delete coupons" ON public.coupons;
CREATE POLICY "Only admins can delete coupons" ON public.coupons FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==========================================
-- TABLA DE CONFIGURACIÓN (SETTINGS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
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

-- Insertar valores por defecto para settings
INSERT INTO public.settings (key, value) VALUES 
('free_shipping_threshold', '100'),
('base_shipping_cost', '6')
ON CONFLICT (key) DO NOTHING;


-- ===============
-- GIF gift_details
-- ===============

-- Agrega las columnas de regalo a la tabla de órdenes si no existen
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_details JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_details JSONB;

-- ==========================================
-- 10. TABLA DE FAVORITOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id)
);

-- Habilitar RLS para Favoritos
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Políticas para Favoritos
DROP POLICY IF EXISTS "Users can view their own favorites." ON public.favorites;
CREATE POLICY "Users can view their own favorites." ON public.favorites FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites." ON public.favorites;
CREATE POLICY "Users can insert their own favorites." ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites." ON public.favorites;
CREATE POLICY "Users can delete their own favorites." ON public.favorites FOR DELETE USING (auth.uid() = user_id);