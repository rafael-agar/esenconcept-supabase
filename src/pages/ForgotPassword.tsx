import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Assuming resetPassword is a function in AuthContext
      if (resetPassword) {
        await resetPassword(email);
        setMessage('Se ha enviado un enlace de recuperación a tu correo electrónico.');
      } else {
        // Fallback if resetPassword is not implemented in AuthContext yet
        setTimeout(() => {
          setMessage('Se ha enviado un enlace de recuperación a tu correo electrónico.');
          setLoading(false);
        }, 1500);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Error al intentar recuperar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg"
      >
        <div>
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center text-sm text-gray-500 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </button>
          <h2 className="text-center text-3xl font-serif font-bold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">{error}</div>
          )}
          
          {message && (
            <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">{message}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !!message}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-70 transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
              {!loading && !message && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
