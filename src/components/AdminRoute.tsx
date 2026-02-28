import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-8">
            No tienes permisos de administrador para acceder a esta sección.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-black text-white py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              Refrescar Sesión
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-100 text-black py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
          <p className="mt-6 text-xs text-gray-400">
            Si acabas de actualizar tu rol en la base de datos, haz clic en "Refrescar Sesión".
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
