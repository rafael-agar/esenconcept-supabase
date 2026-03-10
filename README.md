# Esen Concept Shop

## 1. Visión General
**Esen Concept Shop** es una plataforma de comercio electrónico minimalista y elegante diseñada para una marca de moda femenina. Permite a los usuarios explorar colecciones (categorías), ver detalles de productos, gestionar un carrito de compras, guardar favoritos y realizar pedidos. Además, cuenta con un panel de administración completo para gestionar el inventario, categorías y variantes de productos.

## 2. Stack Tecnológico
- **Frontend:** React 18+ (Vite), TypeScript
- **Estilos:** Tailwind CSS
- **Iconografía:** Lucide React
- **Animaciones:** Framer Motion (`motion/react`)
- **Enrutamiento:** React Router DOM
- **Backend / Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Almacenamiento de Archivos:** Supabase Storage (Buckets para imágenes de productos)

## 3. Flujos Principales (Workflows)

### 3.1. Flujo de Compra (Cliente)
1. **Exploración:** El usuario navega por la página de inicio (Hero de video/imagen, Categorías, Destacados) o utiliza la búsqueda y filtros avanzados en la página de Tienda (`/shop`).
2. **Selección de Producto:** Accede al detalle del producto (`/product/:id`). Aquí puede ver la galería de imágenes, leer la descripción y cuidados, y seleccionar **color**, **talla** y **cantidad**. El sistema valida en tiempo real el stock disponible de la variante seleccionada.
3. **Carrito de Compras:** Añade el producto al carrito. El carrito se gestiona globalmente mediante Context API y se persiste para no perder los datos.
4. **Checkout:** El usuario procede al pago. El flujo finaliza con la confirmación del pedido (actualmente con soporte para redirección a WhatsApp para atención personalizada).

### 3.2. Flujo de Autenticación y Perfil
1. **Registro e Inicio de Sesión:** Autenticación segura gestionada por Supabase (Email/Contraseña). Incluye flujos de recuperación de contraseña (`/forgot-password`, `/reset-password`).
2. **Gestión de Perfil:** Los usuarios autenticados acceden a `/profile` donde pueden:
   - Ver su historial de pedidos.
   - Gestionar su lista de deseos (Favoritos).
   - Actualizar su información personal.

### 3.3. Flujo de Administración (Admin)
1. **Acceso Restringido:** Los usuarios con el rol `admin` tienen acceso a la ruta protegida `/my-admin`.
2. **Gestión de Catálogo (CRUD):**
   - **Categorías:** Crear, editar y eliminar categorías con sus respectivas imágenes.
   - **Tallas:** Gestionar el catálogo global de tallas y su orden de visualización.
   - **Productos:** Creación y edición avanzada de productos. Permite subir múltiples imágenes a Supabase Storage, definir si es un producto simple o un "Bundle" (conjunto de productos), y gestionar **Variantes** (combinaciones de color y talla con su propio stock, precio y SKU).

## 4. Modelo de Datos (Supabase)
El proyecto utiliza una base de datos relacional en PostgreSQL alojada en Supabase. Las tablas principales son:

- `products`: Información base del producto (nombre, slug, descripción, precio, stock general, categoría, flags de oferta/nuevo).
- `categories`: Colecciones o categorías (nombre, slug, imagen).
- `sizes`: Catálogo de tallas disponibles y su orden (`order_index`).
- `product_variants`: Variaciones específicas de un producto. Almacena `color`, `talla`, `stock` específico, `precio` diferenciado y URL de imagen de la variante.
- `product_images`: Galería de imágenes adicionales asociadas a un `product_id`.
- `product_bundle_items`: Tabla puente para productos compuestos (ej. un "Set" que incluye un top y un pantalón), relacionando el producto padre con los productos/variantes hijos y sus cantidades.

## 5. Estructura del Proyecto
```text
src/
├── components/      # Componentes UI reutilizables (Navbar, ProductCard, Hero, CartSidebar, AdminRoute, etc.)
├── context/         # Gestores de estado global (AuthContext, CartContext, ProductContext)
├── pages/           # Vistas principales (Home, Shop, ProductDetail, Admin, Profile, Login, etc.)
├── lib/             # Configuraciones de clientes externos (supabase.ts)
├── data/            # Tipados, interfaces base y datos estáticos de fallback
├── App.tsx          # Configuración de Rutas y Providers
└── index.css        # Estilos globales y configuración de Tailwind
```

## 6. Variables de Entorno
Para ejecutar el proyecto localmente, es necesario crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
VITE_SUPABASE_URL=https://[TU_PROYECTO].supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...[TU_CLAVE_ANONIMA]
```

## 7. Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo (Vite)
npm run dev

# 3. Construir para producción
npm run build
```

## 8. Optimizaciones de UX/UI Implementadas
- **Skeleton Loaders:** Estados de carga animados en la Tienda, Inicio y Detalle de Producto para mejorar la percepción de velocidad.
- **Filtros Dinámicos:** Filtrado por categoría, rango de precio, ofertas y ordenamiento sin recargar la página.
- **Búsqueda Global:** Overlay de búsqueda accesible desde el Navbar con resultados en tiempo real.
- **Responsive Design:** Interfaz completamente adaptada a dispositivos móviles (Mobile-first approach con Tailwind).
