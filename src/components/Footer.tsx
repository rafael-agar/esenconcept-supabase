import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Share2, Mail } from 'lucide-react';
import ContactModal from './ContactModal';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import SocialIcon from './SocialIcon';

export default function Footer() {
  const { categories } = useProducts();
  const { socialLinks } = useCart();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setSubscriptionStatus('idle');

    try {
      const { error } = await supabase
        .from('leads')
        .insert([{ email, whatsapp }]);

      if (error) throw error;
      
      setSubscriptionStatus('success');
      setEmail('');
      setWhatsapp('');
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubscriptionStatus('idle'), 5000);
    } catch (error) {
      console.error('Error subscribing:', error);
      setSubscriptionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {socialLinks.length > 0 ? (
                socialLinks.map((link, index) => (
                  <a 
                    key={index} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-white transition-colors"
                    title={link.name}
                  >
                    <SocialIcon name={link.name} url={link.url} size={20} />
                  </a>
                ))
              ) : (
                <>
                  <a href="https://www.instagram.com/esenconcept" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><Instagram size={20} /></a>
                  <a href="https://www.tiktok.com/@esenconcept" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <SocialIcon name="TikTok" url="https://www.tiktok.com/@esenconcept" size={20} />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Links 1 - Categories */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Categorías</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link 
                    to={`/shop?category=${encodeURIComponent(cat.name)}`} 
                    className="hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <li><span className="text-gray-600">Cargando categorías...</span></li>
              )}
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
          <div className="relative p-8 rounded-2xl bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden group">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] group-hover:bg-amber-500/20 transition-colors duration-700"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-[60px]"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Beneficios Exclusivos</span>
              </div>
              
              <h4 className="text-xl font-serif mb-2 text-white">
                Únete a la lista
              </h4>
              
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Recibe las últimas novedades y <strong className="text-white font-medium">ofertas exclusivas</strong>. Suscríbete hoy y podrías <strong className="text-amber-400 font-medium">ganarte un cupón</strong> de descuento para tu próxima compra.
              </p>
              
              <form onSubmit={handleSubscribe} className="flex flex-col space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tu correo electrónico"
                    required
                    className="w-full bg-black/50 border border-zinc-700 text-white px-4 py-3.5 text-sm rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-zinc-600"
                  />
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="WhatsApp (opcional)"
                    className="w-full bg-black/50 border border-zinc-700 text-white px-4 py-3.5 text-sm rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-zinc-600"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black px-4 py-3.5 text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-amber-50 hover:text-amber-900 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(251,191,36,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Suscribiendo...' : 'Suscribirme'}
                  {!isSubmitting && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                </button>
                
                {subscriptionStatus === 'success' && (
                  <p className="text-amber-400 text-xs text-center font-medium animate-pulse">
                    ¡Gracias por suscribirte! Revisa tu correo pronto.
                  </p>
                )}
                {subscriptionStatus === 'error' && (
                  <p className="text-red-400 text-xs text-center font-medium">
                    Hubo un error. Inténtalo de nuevo.
                  </p>
                )}
              </form>
            </div>
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
