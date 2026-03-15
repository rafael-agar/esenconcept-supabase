import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left hover:text-gray-600 transition-colors"
      >
        <span className="text-lg font-serif font-medium text-gray-900">{question}</span>
        {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-gray-600 leading-relaxed font-light">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 py-24"
    >
      <div className="text-center mb-16">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Preguntas y Respuestas</h1>
        <p className="text-gray-500 uppercase tracking-widest text-sm">Todo lo que necesitas saber sobre ESEN</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 mt-12">Concepto y Marca</h2>
        <FAQItem 
          question="¿Qué significa ESEN Concept?"
          answer={
            <div className="space-y-4">
              <p>ESEN nace de un proceso de transformación personal, de volver a la raíz y reencontrarse con la verdadera esencia. Es ese regreso a lo esencial, a lo que permanece cuando todo lo demás parece desvanecerse.</p>
              <p>Nuestra filosofía se basa en la calma, la suavidad como fuerza y la valentía de volver a empezar.</p>
            </div>
          }
        />
        <FAQItem 
          question="¿Cómo son sus colecciones?"
          answer="Trabajamos bajo un modelo de cápsulas limitadas. Cada pieza es creada con un propósito e intención específica, asegurando exclusividad y atención al detalle en cada confección."
        />

        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 mt-12">Envíos</h2>
        <FAQItem 
          question="¿Cómo realizan los envíos nacionales?"
          answer="En Venezuela, realizamos todos nuestros envíos a través de ZOOM. Puedes elegir recibirlo en una dirección específica o retirarlo en la oficina ZOOM de tu preferencia."
        />
        <FAQItem 
          question="¿Cuánto tarda en llegar mi pedido?"
          answer="El tiempo estimado de entrega es de 1 a 3 días hábiles para envíos nacionales. Si te encuentras en la Isla de Margarita, el tiempo de entrega suele ser menor."
        />
        <FAQItem 
          question="¿Cómo puedo rastrear mi paquete?"
          answer="Una vez procesado el envío, te proporcionaremos un número de guía para que puedas realizar el seguimiento directamente en la plataforma de la empresa de mensajería."
        />

        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 mt-12">Cambios y Garantías</h2>
        <FAQItem 
          question="¿Puedo realizar un cambio si la prenda no me queda?"
          answer={
            <div className="space-y-4">
              <p>Sí, aceptamos cambios voluntarios dentro de los primeros 7 días calendario tras recibir tu pedido. La prenda debe estar en perfectas condiciones, con sus etiquetas y empaque original, y sin señales de uso o lavado.</p>
              <p className="italic text-sm">Nota: Los costos de envío por cambios voluntarios son asumidos por el cliente.</p>
            </div>
          }
        />
        <FAQItem 
          question="¿Qué garantía tienen las prendas?"
          answer="Nuestras piezas cuentan con 15 días calendario de garantía por defectos de fabricación (costuras, fallas estructurales). No cubre daños por uso inadecuado o lavado incorrecto."
        />
        <FAQItem 
          question="¿Realizan devoluciones de dinero?"
          answer="En ESEN no realizamos devoluciones de dinero. En caso de aplicar un cambio o garantía y no contar con inventario de la misma pieza, se ofrecerá un cambio por otro producto de valor equivalente."
        />
      </div>

      <div className="mt-20 p-8 bg-gray-50 rounded-2xl text-center border border-gray-100">
        <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">¿Aún tienes dudas?</h3>
        <p className="text-gray-600 mb-8">Estamos aquí para ayudarte en lo que necesites.</p>
        <div className="flex justify-center">
          <a 
            href="https://wa.me/584226413853?text=Hola%20ESEN%2C%20tengo%20una%20duda%20sobre..." 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-black text-white px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-all hover:scale-105 shadow-lg shadow-black/5"
          >
            <MessageCircle size={20} />
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default FAQ;
