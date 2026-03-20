'use client';
import * as React from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          />
          <motion.div
            className={cn('relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full', sizeMap[size])}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.98 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 rounded-t-2xl">
              <h2 className="text-base sm:text-lg font-bold text-dark">{title}</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-bone transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[85vh] sm:max-h-[80vh] rounded-b-2xl">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
