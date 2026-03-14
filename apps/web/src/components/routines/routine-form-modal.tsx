'use client';

import { Routine, CreateRoutineData } from '@/types/routines';
import { RoutineForm } from './routine-form';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { routinesService } from '@/services/routines.service';

interface RoutineFormModalProps {
  routine?: Routine; // if provided, edit mode
  onClose: () => void;
  onSuccess: () => void;
}

export function RoutineFormModal({ routine, onClose, onSuccess }: RoutineFormModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!routine;

  const mutation = useMutation({
    mutationFn: (data: CreateRoutineData) =>
      isEdit
        ? routinesService.update(routine!.id, data)
        : routinesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      onSuccess();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-dark">
              {isEdit ? 'Editar rutina' : 'Nueva rutina'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEdit ? 'Modifica los datos de la rutina' : 'Crea una rutina de entrenamiento personalizada'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bone transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          {mutation.isError && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              Error al guardar la rutina. Verifica los datos e intenta de nuevo.
            </div>
          )}
          <RoutineForm
            initialData={
              routine
                ? {
                    name: routine.name,
                    description: routine.description,
                    targetGoal: routine.targetGoal,
                    difficulty: routine.difficulty,
                    durationWeeks: routine.durationWeeks,
                    weeklySchedule: routine.weeklySchedule,
                  }
                : undefined
            }
            onSubmit={mutation.mutateAsync}
            onCancel={onClose}
            isLoading={mutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
