import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
      <div
        className={`w-full ${maxWidth} bg-white rounded-[8px] border border-[#e6e6e6] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100`}
      >
        <div className="h-12 px-4 border-b border-[#f0f0f0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0a0a0a]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-[#6b6b6b] hover:text-[#0a0a0a] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 text-xs">{children}</div>
      </div>
    </div>
  );
};
