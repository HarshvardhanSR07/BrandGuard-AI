import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'positive' | 'warning' | 'negative';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className = '',
}) => {
  const styles = {
    info: 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e3a8a]',
    positive: 'bg-[#dcfae5] border-[#bbf7d0] text-[#04250e]',
    warning: 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]',
    negative: 'bg-[#ffedea] border-[#fecaca] text-[#831c1e]',
  };

  const icons = {
    info: Info,
    positive: CheckCircle2,
    warning: AlertTriangle,
    negative: XCircle,
  };

  const Icon = icons[variant];

  return (
    <div
      className={`p-3 rounded-[6px] border text-xs leading-relaxed flex items-start gap-2.5 ${styles[variant]} ${className}`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5 opacity-90" />
      <div className="space-y-0.5">
        {title && <div className="font-semibold">{title}</div>}
        <div className="text-[12px] opacity-95">{children}</div>
      </div>
    </div>
  );
};
