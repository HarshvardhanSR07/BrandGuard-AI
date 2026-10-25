import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'lime' | 'dark' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'lime',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635] focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    // Electric chartreuse lime button from mockup (Sign In, Review, Apply, Run Analysis)
    lime: 'bg-[#a3e635] hover:bg-[#92d825] text-[#0c0e12] font-semibold shadow-xs border border-[#92d825]',
    // Dark void pill button (+ New Draft, + Add Rule, + Invite Member)
    dark: 'bg-[#12161c] hover:bg-[#000000] text-white font-medium border border-[#232934]',
    // Default primary points to lime
    primary: 'bg-[#a3e635] hover:bg-[#92d825] text-[#0c0e12] font-semibold shadow-xs border border-[#92d825]',
    // Warm parchment secondary
    secondary: 'bg-[#ede6db] hover:bg-[#e4ddd3] text-[#12161c] border border-[#d9d1c5]',
    // Hairline outline
    outline: 'bg-white/80 hover:bg-white text-[#12161c] border border-[#d9d1c5] shadow-xs',
    // Controlled danger
    danger: 'bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] border border-[#fca5a5]',
    // Minimal ghost
    ghost: 'hover:bg-[#ede6db]/60 text-[#736d64] hover:text-[#12161c]',
  };

  const sizes = {
    sm: 'text-xs h-7 px-2.5 gap-1.5 rounded-md',
    md: 'text-xs h-8 px-3.5 gap-2 rounded-lg',
    lg: 'text-sm h-10 px-5 gap-2.5 rounded-xl',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
