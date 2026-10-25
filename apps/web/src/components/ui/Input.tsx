import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1 w-full text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-[#0a0a0a]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full h-8 px-3 text-xs bg-white border rounded-[6px] text-[#0a0a0a] placeholder:text-[#a3a3a3] transition-colors focus:outline-none focus:border-[#141414] disabled:bg-[#f5f5f5] disabled:cursor-not-allowed ${
            error ? 'border-[#c4242a]' : 'border-[#d4d4d4]'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] text-[#c4242a]">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-[#6b6b6b]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
