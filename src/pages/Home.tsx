import React from 'react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { products, categories } = useProducts();

  return (
    <>
      <Hero />

      {/* Categories Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold mb-4">Cápsulas</h2>
          <div className="w-12 h-0.5 bg-black mx-auto"></div>
        </div>
        
        <div className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory scrollbar-hide">
          {categories.map((category) => (
            <motion.div 
              key={category.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative group cursor-pointer overflow-hidden h-[400px] min-w-[300px] flex-shrink-0 snap-center"
            >
              <Link to={`/shop?category=${encodeURIComponent(category.name)}`} className="block w-full h-full">
                <img 
                  src={category.image} 
                  alt={category.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                  <h3 className="text-white text-2xl font-serif font-bold tracking-widest uppercase border-b-2 border-white pb-2">
                    {category.name}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="shop" className="py-20 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4">Productos Destacados</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Descubre nuestra selección de prendas favoritas para esta temporada.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Link to="/shop" className="inline-block border border-black px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
              Ver Todo
            </Link>
          </div>
        </div>
      </section>

      {/* Promo Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gray-900">
          <img 
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop" 
            alt="Promo Background" 
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative max-w-7xl mx-auto text-center text-white">
          <span className="text-sm font-bold uppercase tracking-widest mb-4 block">Oferta Especial</span>
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8">Rebajas de Invierno</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto font-light">
            Hasta un 50% de descuento en artículos seleccionados. Renueva tu guardarropa con estilo.
          </p>
          <Link 
            to="/shop?filter=sale"
            className="inline-block bg-white text-black px-10 py-4 text-sm font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
          >
            Comprar Rebajas
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <img 
              src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=2073&auto=format&fit=crop" 
              alt="About Us" 
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="order-1 md:order-2 md:pl-12">
            <h2 className="text-3xl font-serif font-bold mb-6">Sobre Mí</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              ESEN CONCEPT nace desde un proceso de transformación personal, de volver a la raíz, de aprender a sostenerme, de sanar, de confiar.
              Es recordar quién eras antes del ruido, antes del miedo, antes de convertirte en una versión que no se sentía propia.
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Nuestra primera cápsula, RAÍZ, habla de estabilidad. De identidad. De reconstrucción silenciosa.
              Deseo que cada prenda que uses recuerdes lo valiosa, fuerte, poderosa que eres y todo lo que has superado.
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed font-medium italic">
              ESEN es un recordatorio de tu ESENcia.<br/>
              Porque cuando una mujer vuelve a su raíz,<br/>
              no retrocede.<br/>
              Se alinea.<br/>
              Y desde ahí, florece.
            </p>
            <Link to="/about" className="text-black font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors">
              Leer Más
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
