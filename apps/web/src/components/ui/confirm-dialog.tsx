'use client';

import { Button } from './button';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-xl shrink-0', variant === 'danger' ? 'bg-red-100' : 'bg-yellow-100')}>
            <AlertTriangle className={cn('h-5 w-5', variant === 'danger' ? 'text-red-500' : 'text-yellow-500')} />
          </div>
          <div>
            <p className="font-semibold text-dark">{title}</p>
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={cn(variant === 'danger' && 'bg-red-500 hover:bg-red-600 text-white border-red-500')}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
