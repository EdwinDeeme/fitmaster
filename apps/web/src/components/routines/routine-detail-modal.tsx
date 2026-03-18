'use client';

import { Routine } from '@/types/routines';
import { DifficultyBadge, GoalBadge } from './routine-badge';
import { Button } from '@/components/ui/button';
import { X, Calendar, Clock, Users, Dumbbell } from 'lucide-react';

interface RoutineDetailModalProps {
  routine: Routine;
  onClose: () => void;
  onAssign: () => void;
}

export function RoutineDetailModal({ routine, onClose, onAssign }: RoutineDetailModalProps) {
  const days = Object.entries(routine.weeklySchedule || {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-dark">{routine.name}</h2>
            {routine.description && (
              <p className="text-sm text-gray-500 mt-1">{routine.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <DifficultyBadge difficulty={routine.difficulty} />
              <GoalBadge goal={routine.targetGoal} />
              {routine.isAIGenerated && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700">
                  ✨ Generada con IA
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bone transition-colors ml-4 shrink-0"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-bone/50">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-gray-500">Duración</p>
              <p className="text-sm font-bold text-dark">{routine.durationWeeks} semanas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-gray-500">Días/semana</p>
              <p className="text-sm font-bold text-dark">{days.length} días</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-gray-500">Asignados</p>
              <p className="text-sm font-bold text-dark">{routine._count?.assignments || 0}</p>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {days.map(([dayKey, day]) => (
            <div key={dayKey} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-bone">
                <Dumbbell className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-dark text-sm">{day.name || dayKey}</h4>
                <span className="ml-auto text-xs text-gray-500">{day.exercises?.length || 0} ejercicios</span>
              </div>
              <div className="divide-y divide-gray-50">
                {(day.exercises || []).map((exercise, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-dark">{exercise.name}</p>
                      {exercise.notes && (
                        <p className="text-xs text-gray-400 mt-0.5">{exercise.notes}</p>
                      )}
                      {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {exercise.muscleGroups.map((mg) => (
                            <span key={mg} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                              {mg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-dark">
                        {exercise.sets} × {exercise.reps}
                      </p>
                      <p className="text-xs text-gray-400">{exercise.restSeconds}s descanso</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
          <Button onClick={onAssign} className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Asignar a cliente
          </Button>
        </div>
      </div>
    </div>
  );
}
