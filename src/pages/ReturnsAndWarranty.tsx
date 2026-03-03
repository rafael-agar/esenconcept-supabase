import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';

const ReturnsAndWarranty: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 py-24"
    >
      <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100 rounded-2xl">
        <h1 className="text-3xl font-serif font-bold text-center mb-2 tracking-wider">CAMBIOS Y GARANTÍAS – ESEN</h1>
        <p className="text-center text-gray-500 mb-12 text-sm uppercase tracking-widest">Última actualización: Marzo 2026</p>

        <div className="space-y-8">
          <p className="text-gray-600 leading-relaxed">
            En ESEN diseñamos cápsulas limitadas con altos estándares de calidad, cuidando cada detalle en proceso, confección y acabado. Antes de solicitar un cambio o garantía, te invitamos a leer cuidadosamente la siguiente información:
          </p>

          <section>
            <h2 className="text-xl font-serif font-bold mb-4 text-gray-900 uppercase tracking-tight">Cambios Voluntarios</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Si deseas realizar un cambio voluntario, podrás hacerlo dentro de un plazo máximo de 7 días calendario tras recibir tu pedido. Para que el cambio sea aprobado, la prenda debe:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 marker:text-gray-400">
              <li>Estar en perfectas condiciones</li>
              <li>No presentar uso, lavado ni alteraciones</li>
              <li>Conservar sus etiquetas originales</li>
              <li>Mantener su empaque original</li>
            </ul>
            <p className="text-gray-600 mt-4 leading-relaxed italic">
              Los costos de envío derivados del cambio serán asumidos por el cliente.
            </p>
          </section>

          <section className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-serif font-bold mb-3 text-gray-900">Condiciones especiales:</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 marker:text-gray-400">
              <li>Las prendas de cápsulas anteriores solo podrán cambiarse por productos de la misma cápsula (sujeto a disponibilidad).</li>
              <li>El cambio se realizará por el valor actual vigente de la prenda.</li>
              <li>No se permiten cambios de prendas de colecciones anteriores por artículos de nueva cápsula.</li>
              <li><strong>ESEN no realiza devoluciones de dinero.</strong></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif font-bold mb-4 text-gray-900 uppercase tracking-tight">Garantía</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Nuestras prendas cuentan con un período de 15 días calendario de garantía, contados a partir de la fecha de compra, exclusivamente por defectos de fabricación.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 mt-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">La garantía cubre:</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 marker:text-gray-400">
                  <li>Fallas estructurales en costuras</li>
                  <li>Defectos evidentes de confección</li>
                  <li>Imperfecciones de fábrica comprobables</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">La garantía no cubre:</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 marker:text-gray-400">
                  <li>Daños ocasionados por uso inadecuado</li>
                  <li>Manipulación incorrecta del material</li>
                  <li>Lavado o secado inadecuado</li>
                  <li>Desgaste natural por uso</li>
                  <li>Rasgaduras, roturas o alteraciones posteriores a la entrega</li>
                </ul>
              </div>
            </div>
            
            <p className="text-gray-600 mt-6 leading-relaxed">
              Cada caso será evaluado por nuestro equipo antes de aprobar cualquier reposición o cambio.
            </p>
            
            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-amber-800 text-sm leading-relaxed">
                Al trabajar con cápsulas limitadas, algunas piezas pueden no estar disponibles para reposición. En caso de no contar con inventario, se ofrecerá cambio por otro producto de valor equivalente.
              </p>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-16 p-8 bg-gray-50 rounded-2xl text-center border border-gray-100">
        <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">¿Aún tienes dudas?</h3>
        <p className="text-gray-600 mb-8">Estamos aquí para ayudarte en lo que necesites.</p>
        <div className="flex justify-center">
          <a 
            href="https://wa.me/584226413853?text=Hola%20ESEN%2C%20me%20gustar%C3%ADa%20consultar%20sobre%20un%20cambio%20o%20garant%C3%ADa..." 
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

export default ReturnsAndWarranty;
