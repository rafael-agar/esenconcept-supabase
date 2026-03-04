import React from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '../context/CartContext';

export default function FreeShippingProgress() {
  const { cartSubtotal, cartCount, freeShippingThreshold, shippingCost } = useCart();
  
  const isFree = shippingCost === 0;
  
  // Calculate progress based on amount
  const progress = Math.min((cartSubtotal / freeShippingThreshold) * 100, 100);
  
  const missingAmount = freeShippingThreshold - cartSubtotal;

  if (cartCount === 0) return null;

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 overflow-hidden relative">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-full ${isFree ? 'bg-green-100 text-green-600' : 'bg-black text-white'}`}>
          {isFree ? <CheckCircle2 size={18} /> : <Truck size={18} />}
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider">
            {isFree ? '¡Envío Gratis Aplicado!' : 'Envío Gratis'}
          </h4>
          <p className="text-xs text-gray-500">
            {isFree 
              ? 'Has alcanzado el beneficio de envío sin costo.' 
              : `Aprovecha el envío gratis por compras mayores a $${freeShippingThreshold}.`}
          </p>
        </div>
      </div>

      {!isFree && (
        <div className="space-y-3">
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="absolute top-0 left-0 h-full bg-black"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            {missingAmount > 0 && (
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                Te faltan <span className="text-black font-bold">${missingAmount.toFixed(2)}</span> para envío gratis
              </p>
            )}
          </div>
        </div>
      )}

      {isFree && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-100 p-2 rounded-lg flex items-center justify-center gap-2"
        >
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">
            ¡Felicidades! Tu envío es cortesía de ESEN
          </span>
        </motion.div>
      )}
    </div>
  );
}
