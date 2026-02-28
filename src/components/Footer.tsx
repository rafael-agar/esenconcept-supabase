import React from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-serif font-bold tracking-wider">ESEN CONCEPT</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Moda contemporánea para la mujer moderna. Diseños únicos que inspiran confianza y elegancia.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter size={20} /></a>
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Tienda</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Novedades</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Ropa</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Accesorios</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Rebajas</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Ayuda</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Envíos y Devoluciones</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Guía de Tallas</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Preguntas Frecuentes</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Suscríbete</h4>
            <p className="text-gray-400 text-sm mb-4">
              Recibe las últimas novedades y ofertas exclusivas.
            </p>
            <form className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="bg-transparent border border-gray-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
              />
              <button className="bg-white text-black px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
                Suscribirse
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; 2024 Esen Concept. Todos los derechos reservados.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
