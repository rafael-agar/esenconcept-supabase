import React from 'react';
import Spinner from './Spinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  message = 'Guardando...', 
  fullScreen = false 
}) => {
  if (!isLoading) return null;

  const containerClasses = fullScreen 
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm'
    : 'absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-black" />
        {message && <p className="text-sm font-medium text-gray-600 animate-pulse">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingOverlay;
