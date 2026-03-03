import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="bg-white text-gray-900 min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-center mb-2 tracking-wider">POLÍTICA DE PRIVACIDAD – ESEN</h1>
        <p className="text-center text-gray-500 mb-12 text-sm uppercase tracking-widest">Última actualización: Marzo 2026</p>

        <div className="space-y-8">
          <p className="text-gray-600 leading-relaxed">
            En ESEN valoramos tu privacidad y nos comprometemos a proteger la información personal que compartes con nosotros. Esta política explica cómo recopilamos, utilizamos y protegemos tus datos.
          </p>

          <section>
            <h2 className="text-xl font-serif font-bold mb-4 text-gray-900">1. Información que recopilamos</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Podemos recopilar la siguiente información cuando realizas una compra o interactúas con nuestra página:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 marker:text-gray-400">
              <li>Nombre y apellido</li>
              <li>Dirección de envío</li>
              <li>Número de teléfono</li>
              <li>Correo electrónico</li>
              <li>Información necesaria para procesar el pago</li>
              <li>Datos de navegación (cookies, IP, dispositivo)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif font-bold mb-4 text-gray-900">2. Uso de la información</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              La información recopilada se utiliza para:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 marker:text-gray-400">
              <li>Procesar y enviar tus pedidos</li>
              <li>Confirmar compras y entregas</li>
              <li>Brindar atención al cliente</li>
              <li>Enviar información sobre lanzamientos o promociones (solo si el cliente lo autoriza)</li>
              <li>Mejorar la experiencia en nuestra web</li>
            </ul>
            <p className="text-gray-600 mt-4 font-medium">
              ESEN no vende ni comparte tu información personal con terceros con fines comerciales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-bold mb-4 text-gray-900">3. Protección de datos</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Implementamos medidas de seguridad para proteger tu información personal contra accesos no autorizados, alteraciones o divulgaciones indebidas.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Los pagos se procesan a través de plataformas seguras externas. ESEN no almacena datos completos de tarjetas bancarias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-bold mb-4 text-gray-900">4. Cookies</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Nuestra página puede utilizar cookies para mejorar tu experiencia de navegación y analizar el comportamiento del usuario.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Puedes desactivarlas desde la configuración de tu navegador si así lo deseas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-bold mb-4 text-gray-900">5. Derechos del usuario</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Como usuario tienes derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 marker:text-gray-400">
              <li>Solicitar acceso a tus datos personales</li>
              <li>Solicitar corrección o eliminación de tu información</li>
              <li>Retirar tu consentimiento para recibir comunicaciones</li>
            </ul>
            <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
              <p className="text-gray-700 font-medium mb-2">Para ejercer estos derechos puedes contactarnos a:</p>
              <p className="text-gray-600">📞 WhatsApp: 0422-6413853</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-serif font-bold mb-4 text-gray-900">6. Cambios en la política</h2>
            <p className="text-gray-600 leading-relaxed">
              ESEN se reserva el derecho de modificar esta Política de Privacidad en cualquier momento. Las actualizaciones serán publicadas en esta misma sección.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
