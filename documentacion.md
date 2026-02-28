Para configurar tu usuario como administrador y poder empezar a cargar productos, debes seguir estos pasos:
1. Registrar el usuario en la aplicación

Primero, ve a la página de registro de tu aplicación (/login y cambia a "Crear cuenta") y regístrate con el correo agargato@gmail.com.

Debido a que el trigger que creamos en el schema.sql asigna por defecto el rol de 'customer', tu usuario se creará inicialmente como un cliente normal.
2. Promover a Admin vía SQL

Una vez registrado, debes ir al SQL Editor de tu panel de Supabase y ejecutar el siguiente comando para cambiar tu rol a administrador:
code SQL

-- Cambiar el rol de tu usuario a admin
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'agargato@gmail.com'
);

3. Configuración de Autenticación (El "2do paso")

Si te refieres a la confirmación de correo electrónico (que Supabase activa por defecto), tienes dos opciones:

    Opción A (Recomendada para desarrollo): Ve a Authentication > Providers > Email en Supabase y desactiva la opción "Confirm email". Esto te permitirá entrar directamente después de registrarte.

    Opción B (Manual): Ve a Authentication > Users, busca tu usuario y haz clic en los tres puntos ... -> "Confirm user".

4. Cargar Categorías y Productos

Una vez que seas admin:

    Inicia sesión en la web.

    Ve a la ruta /my-admin.

    Como las tablas están vacías, primero debes crear al menos una categoría en la pestaña de "Productos" (o si prefieres, te doy un script para insertar categorías base).

    Luego ya podrás subir tus productos con sus imágenes.


Aquí tienes el script SQL para insertar esas categorías iniciales. Cópialo y ejecútalo en el SQL Editor de tu panel de Supabase:
code SQL

-- Insertar categorías iniciales
INSERT INTO public.categories (name, slug, description)
VALUES 
  ('Sets', 'sets', 'Conjuntos combinados de última tendencia'),
  ('Pantalones', 'pantalones', 'Pantalones, jeans y leggings para toda ocasión'),
  ('Blusas', 'blusas', 'Blusas, tops y camisas elegantes y casuales')
ON CONFLICT (slug) DO NOTHING;

Pasos a seguir ahora:

    Ejecuta el script: Esto llenará la tabla de categorías.

    Entra al Admin: Ve a /my-admin en tu aplicación.

    Carga Productos: Ahora, al crear un producto, verás que en el selector de categorías ya aparecen "Sets", "Pantalones" y "Blusas".

Nota: Recuerda que para que el panel de administración te deje entrar, primero debes haber ejecutado el comando de mi respuesta anterior para asignarle el rol de admin a tu correo agargato@gmail.com.


