import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'md', color = 'purple' }) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colors = {
    purple: 'text-purple-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <Loader2 
      className={`${sizes[size]} ${colors[color]} animate-spin`}
      aria-label="Loading"
    />
  );
};

export const DotsLoader = ({ color = 'purple' }) => {
  const colors = {
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    gray: 'bg-gray-600'
  };

  return (
    <div className="flex space-x-2" aria-label="Loading">
      <div className={`w-2 h-2 ${colors[color]} rounded-full animate-bounce`} 
           style={{ animationDelay: '0ms' }}></div>
      <div className={`w-2 h-2 ${colors[color]} rounded-full animate-bounce`} 
           style={{ animationDelay: '150ms' }}></div>
      <div className={`w-2 h-2 ${colors[color]} rounded-full animate-bounce`} 
           style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

export const LoadingOverlay = ({ message = 'Loading...', show = true }) => {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]"
      role="dialog"
      aria-label="Loading"
      aria-busy="true"
    >
      <div className="bg-white rounded-xl p-6 sm:p-8 flex flex-col items-center shadow-2xl max-w-sm mx-4">
        <Spinner size="xl" color="purple" />
        <p className="mt-4 text-gray-700 text-center font-medium">{message}</p>
      </div>
    </div>
  );
};

export const InlineLoader = ({ message, size = 'md' }) => {
  return (
    <div className="flex items-center gap-3 py-2">
      <Spinner size={size} color="purple" />
      {message && (
        <span className="text-gray-600 text-sm">{message}</span>
      )}
    </div>
  );
};

export const ProgressBar = ({ 
  progress = 0, 
  color = 'purple', 
  showLabel = true,
  size = 'md'
}) => {
  const colors = {
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600'
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizes[size]} overflow-hidden`}>
        <div 
          className={`${colors[color]} ${sizes[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    </div>
  );
};

export const LoadingButton = ({ 
  loading = false, 
  children, 
  disabled = false,
  className = '',
  loadingText = 'Loading...',
  ...props 
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 ${className} ${
        loading || disabled ? 'opacity-60 cursor-not-allowed' : ''
      }`}
      {...props}
    >
      {loading && <Spinner size="sm" color="white" />}
      {loading ? loadingText : children}
    </button>
  );
};

export default {
  Spinner,
  DotsLoader,
  LoadingOverlay,
  InlineLoader,
  ProgressBar,
  LoadingButton
};
