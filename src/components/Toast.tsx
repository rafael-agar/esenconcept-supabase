import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300 ${
      type === 'success' 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {type === 'success' ? (
        <CheckCircle size={20} className="text-green-600" />
      ) : (
        <XCircle size={20} className="text-red-600" />
      )}
      <p className="text-sm font-medium">{message}</p>
      <button 
        onClick={onClose}
        className={`ml-2 p-1 rounded-full hover:bg-black/5 transition-colors ${
          type === 'success' ? 'text-green-600' : 'text-red-600'
        }`}
      >
        <X size={16} />
      </button>
    </div>
  );
};
