import React from 'react';
import { motion } from 'motion/react';

const ShippingInfo: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 py-24"
    >
      <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100 rounded-2xl">
        <h1 className="text-3xl font-serif font-bold text-center mb-2 tracking-wider">INFORMACIÓN DE ENVÍOS – ESEN</h1>
        <p className="text-center text-gray-500 mb-12 text-sm uppercase tracking-widest">Última actualización: Marzo 2026</p>

        <div className="space-y-12">
          {/* Envíos Nacionales */}
          <section>
            <h2 className="text-xl font-serif font-bold mb-6 text-gray-900 uppercase tracking-tight border-b border-gray-100 pb-2">Envíos Nacionales (Venezuela)</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Los envíos se realizan a través de <strong>ZOOM</strong>, empresa de mensajería con cobertura nacional.
              </p>
              <p>
                El tiempo estimado de entrega es de <strong>1 a 3 días hábiles</strong>, dependiendo del destino y las condiciones operativas de la empresa de transporte.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mt-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Opciones de recepción:</h3>
                <ul className="list-disc pl-5 space-y-2 marker:text-gray-400">
                  <li>En la dirección indicada por el cliente</li>
                  <li>Retirados en la oficina ZOOM seleccionada</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Seguimiento */}
          <section>
            <h2 className="text-xl font-serif font-bold mb-4 text-gray-900 uppercase tracking-tight">Seguimiento</h2>
            <p className="text-gray-600 leading-relaxed">
              Una vez procesado el envío, se enviará el número de guía correspondiente para que el cliente pueda rastrear su paquete directamente con la empresa de transporte.
            </p>
          </section>

          {/* Información Importante */}
          <section>
            <h2 className="text-xl font-serif font-bold mb-6 text-gray-900 uppercase tracking-tight">Información Importante</h2>
            <ul className="space-y-4 text-gray-600">
              <li className="flex gap-3">
                <span className="text-gray-300 font-bold">•</span>
                <p>ESEN no se hace responsable por retrasos atribuibles a la empresa de mensajería.</p>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-300 font-bold">•</span>
                <p>Es responsabilidad del cliente suministrar correctamente sus datos de envío.</p>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-300 font-bold">•</span>
                <p>En caso de dirección incorrecta o devolución del paquete, el costo de un nuevo envío deberá ser asumido por el cliente.</p>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-300 font-bold">•</span>
                <p>Los tiempos de entrega pueden variar en temporadas altas, días festivos o situaciones operativas externas.</p>
              </li>
            </ul>
          </section>

          {/* Entregas Locales */}
          <section className="pt-8 border-t border-gray-100">
            <h2 className="text-xl font-serif font-bold mb-4 text-gray-900 uppercase tracking-tight">Entregas Locales – Isla de Margarita</h2>
            <p className="text-gray-600 leading-relaxed">
              Para clientes ubicados en la <strong>Isla de Margarita, Venezuela</strong>, el tiempo de entrega puede ser menor dependiendo de la disponibilidad operativa.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default ShippingInfo;
