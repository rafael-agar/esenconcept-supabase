-- Fix RLS policies for orders to allow admins to create orders for customers
DROP POLICY IF EXISTS "Users can insert their own orders." ON public.orders;
CREATE POLICY "Users and admins can insert orders" ON public.orders 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Fix RLS policies for order_items to allow admins to create order items
DROP POLICY IF EXISTS "Users can insert their own order items." ON public.order_items;
CREATE POLICY "Users and admins can insert order items" ON public.order_items 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (
      orders.user_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
);

-- Fix RLS policies for profiles to allow admins to create/update profiles for customers
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users and admins can insert profiles" ON public.profiles 
FOR INSERT WITH CHECK (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users and admins can update profiles" ON public.profiles 
FOR UPDATE USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
