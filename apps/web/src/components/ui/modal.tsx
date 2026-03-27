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
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeWidths: Record<string, number> = {
  sm:  448,
  md:  512,
  lg:  672,
  xl:  896,
  '2xl': 1024,
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const maxWidth = sizeWidths[size] ?? 512;

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          />

          {/* Panel */}
          <motion.div
            className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full overflow-hidden"
            style={{ maxWidth }}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={prefersReducedMotion
              ? { opacity: 1, maxWidth }
              : { opacity: 1, y: 0, scale: 1, maxWidth }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{
              opacity:   { duration: prefersReducedMotion ? 0 : 0.2 },
              y:         { duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' },
              scale:     { duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' },
              maxWidth:  { duration: prefersReducedMotion ? 0 : 0.35, ease: [0.4, 0, 0.2, 1] },
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-dark">{title}</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-bone transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[85vh] sm:max-h-[80vh]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
