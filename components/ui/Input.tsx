import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative mb-6 ${className || ''}`}>
      <label 
        className={`block text-sm font-medium transition-colors duration-300 mb-2 ${
          isFocused ? 'text-primary' : 'text-gray-400'
        } ${error ? 'text-red-400' : ''}`}
      >
        {label}
      </label>
      <div className="relative group">
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            block w-full py-3 px-4 rounded-lg bg-gray-800/50 
            text-gray-100 placeholder-gray-600
            border-b-2 appearance-none focus:outline-none focus:ring-0 
            transition-all duration-300
            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-gray-700'}
            ${isFocused && !error ? 'border-primary bg-gray-800' : ''}
          `}
        />
        {/* Animated underline glow effect */}
        <div 
          className={`
            absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-cyan-500 to-purple-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]
            transition-all duration-500 ease-out rounded-b-lg
            ${isFocused ? 'w-full opacity-100' : 'w-0 opacity-0'}
          `}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400 animate-pulse">{error}</p>
      )}
    </div>
  );
};