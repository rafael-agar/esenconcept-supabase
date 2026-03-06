import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Instagram, Mail, Copy, Check, MessageCircle } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const email = 'esenconcept@gmail.com';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-3xl overflow-hidden z-[101] shadow-2xl"
          >
            <div className="relative p-8 md:p-10">
              <button
                onClick={onClose}
                className="absolute right-6 top-6 text-gray-400 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle size={32} className="text-black" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">Contacto</h2>
                <p className="text-gray-500 leading-relaxed">
                  ¿Quieres saber más sobre ESEN o tienes alguna consulta? Estamos aquí para escucharte y ayudarte en lo que necesites.
                </p>
              </div>

              <div className="space-y-4">
                {/* Email */}
                <div className="group relative bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Mail size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Email</p>
                      <p className="text-sm font-medium text-gray-900">{email}</p>
                    </div>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-black"
                    title="Copiar email"
                  >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/584226413853"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-gray-200 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <MessageCircle size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">WhatsApp</p>
                    <p className="text-sm font-medium text-gray-900">+58 422 641 3853</p>
                  </div>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/esenconcept"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-gray-200 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Instagram size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Instagram</p>
                    <p className="text-sm font-medium text-gray-900">@esenconcept</p>
                  </div>
                </a>

                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@esenconcept"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-gray-200 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <svg 
                      viewBox="0 0 24 24" 
                      className="w-[18px] h-[18px] fill-gray-600"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.36-.54.38-.89.96-.99 1.6-.13.58-.1 1.18.09 1.74.36.93 1.2 1.63 2.18 1.81.74.14 1.53.01 2.18-.36.6-.33 1.03-.91 1.21-1.58.12-.48.13-.97.12-1.46-.01-4.58-.02-9.17-.03-13.75z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">TikTok</p>
                    <p className="text-sm font-medium text-gray-900">@esenconcept</p>
                  </div>
                </a>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
                  ESEN Concept &copy; 2026
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContactModal;
