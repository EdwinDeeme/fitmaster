'use client';

import { Routine, CreateRoutineData } from '@/types/routines';
import { RoutineForm } from './routine-form';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { routinesService } from '@/services/routines.service';
import { motion, useReducedMotion } from 'framer-motion';

interface RoutineFormModalProps {
  routine?: Routine; // if provided, edit mode
  onClose: () => void;
  onSuccess: () => void;
}

export function RoutineFormModal({ routine, onClose, onSuccess }: RoutineFormModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!routine;
  const prefersReducedMotion = useReducedMotion();

  const [headerTitle, setHeaderTitle] = useState(isEdit ? 'Editar rutina' : 'Nueva rutina');
  const [headerSubtitle, setHeaderSubtitle] = useState(
    isEdit ? 'Modifica los datos de la rutina' : 'Crea una rutina de entrenamiento personalizada',
  );

  const mutation = useMutation({
    mutationFn: async ({ data, clientId }: { data: CreateRoutineData; clientId?: string }) => {
      const result = isEdit
        ? await routinesService.update(routine!.id, data)
        : await routinesService.create(data);

      // Auto-assign to client if selected during creation
      if (!isEdit && clientId) {
        await routinesService.assign(result.id, {
          clientId,
          startDate: new Date().toISOString().split('T')[0],
        });

        // Auto-log initial weights for exercises that have a weight defined
        // Exercise notes field stores "weight|equipmentId"
        const exercisesWithWeight = Object.values(data.weeklySchedule)
          .flatMap((day: any) => day.exercises ?? [])
          .filter((ex: any) => {
            const notesStr = ex.notes ?? '';
            const w = notesStr.includes('|') ? notesStr.split('|')[0] : notesStr;
            return w && !isNaN(parseFloat(w)) && parseFloat(w) > 0;
          });

        // Deduplicate by name
        const seen = new Set<string>();
        for (const ex of exercisesWithWeight) {
          if (seen.has(ex.name)) continue;
          seen.add(ex.name);
          const notesStr = ex.notes ?? '';
          const weightStr = notesStr.includes('|') ? notesStr.split('|')[0] : notesStr;
          await routinesService.logExercise(clientId, result.id, {
            exerciseName: ex.name,
            sets: ex.sets,
            reps: String(ex.reps),
            weightKg: parseFloat(weightStr),
            weekNumber: 1,
            notes: 'Peso inicial',
          });
        }
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      onSuccess();
    },
  });

  const handleSubmit = async (data: CreateRoutineData, clientId?: string) => {
    await mutation.mutateAsync({ data, clientId });
  };

  return (
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
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] flex flex-col"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 22, scale: 0.985 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.99 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-dark">{headerTitle}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{headerSubtitle}</p>
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
            <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">
              {(mutation.error as any)?.response?.data?.message
                ? Array.isArray((mutation.error as any).response.data.message)
                  ? (mutation.error as any).response.data.message.join(', ')
                  : (mutation.error as any).response.data.message
                : 'Error al guardar la rutina. Verifica los datos e intenta de nuevo.'}
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
            initialClientId={routine?.assignments?.[0]?.clientId}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={mutation.isPending}
            onHeaderChange={(title, subtitle) => {
              setHeaderTitle(title);
              setHeaderSubtitle(subtitle);
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
