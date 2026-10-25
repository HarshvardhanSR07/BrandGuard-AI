import React from 'react';

export type BadgeVariant =
  | 'high'
  | 'medium'
  | 'low'
  | 'approved'
  | 'review'
  | 'analysis'
  | 'draft'
  | 'active'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'neutral'
  | 'data';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const styles: Record<BadgeVariant, string> = {
    // Exact colors from the 12-screen mockup
    high: 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]',
    medium: 'bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]',
    low: 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]',
    approved: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',
    active: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',
    review: 'bg-[#ffe4e6] text-[#be123c] border-[#fecdd3]',
    analysis: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]',
    draft: 'bg-[#f3f4f6] text-[#4b5563] border-[#e5e7eb]',
    // Backward compatibility
    positive: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',
    negative: 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]',
    warning: 'bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]',
    neutral: 'bg-[#f3f4f6] text-[#4b5563] border-[#e5e7eb]',
    data: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded-md font-medium tracking-wide',
    md: 'text-xs px-2.5 py-0.5 rounded-full font-medium tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border leading-tight tabular-nums select-none ${styles[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
