-- Añadir columna email a la tabla profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Actualizar el trigger para que guarde el email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar los emails de los perfiles existentes (opcional, requiere permisos de superusuario o ejecutarlo desde el panel de Supabase)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
