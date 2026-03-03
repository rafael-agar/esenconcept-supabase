import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import ContactModal from './ContactModal';

export default function Footer() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <img width="100" height="100" src="https://wrpsqmdwhwbruqgyjdis.supabase.co/storage/v1/object/public/product-images/ESEN%20logo%20blanco.png"/>
            <p className="text-gray-400 text-sm leading-relaxed">
              Moda contemporánea para la mujer moderna. Diseños únicos que inspiran confianza y elegancia.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="https://www.instagram.com/esenconcept" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="https://www.tiktok.com/@esenconcept" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-5 h-5 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.36-.54.38-.89.96-.99 1.6-.13.58-.1 1.18.09 1.74.36.93 1.2 1.63 2.18 1.81.74.14 1.53.01 2.18-.36.6-.33 1.03-.91 1.21-1.58.12-.48.13-.97.12-1.46-.01-4.58-.02-9.17-.03-13.75z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Tienda</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/shop" className="hover:text-white transition-colors">Novedades</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Ropa</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Accesorios</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Rebajas</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Ayuda</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/shipping-info" className="hover:text-white transition-colors">Información de Envíos</Link></li>
              <li><Link to="/returns-and-warranty" className="hover:text-white transition-colors">Cambios y Garantías</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Preguntas y Respuestas</Link></li>
              <li>
                <button 
                  onClick={() => setIsContactModalOpen(true)}
                  className="hover:text-white transition-colors"
                >
                  Contacto
                </button>
              </li>
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
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacidad</Link>
            <Link to="/shipping-info" className="hover:text-white transition-colors">Envíos</Link>
            <Link to="/returns-and-warranty" className="hover:text-white transition-colors">Cambios y Garantías</Link>
          </div>
        </div>
      </div>
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </footer>
  );
}
