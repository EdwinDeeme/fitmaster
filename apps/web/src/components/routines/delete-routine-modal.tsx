'use client';

import { Routine } from '@/types/routines';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { routinesService } from '@/services/routines.service';

interface DeleteRoutineModalProps {
  routine: Routine;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteRoutineModal({ routine, onClose, onSuccess }: DeleteRoutineModalProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => routinesService.remove(routine.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      onSuccess();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto">
          <Trash2 className="h-7 w-7 text-red-600" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-bold text-dark">Eliminar rutina</h2>
          <p className="text-sm text-gray-500 mt-2">
            ¿Estás seguro de que deseas eliminar{' '}
            <span className="font-semibold text-dark">"{routine.name}"</span>?
            Esta acción no se puede deshacer.
          </p>
          {(routine._count?.assignments || 0) > 0 && (
            <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mt-3">
              Esta rutina tiene {routine._count?.assignments} asignación(es) activa(s).
            </p>
          )}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">
            Error al eliminar. Intenta de nuevo.
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
