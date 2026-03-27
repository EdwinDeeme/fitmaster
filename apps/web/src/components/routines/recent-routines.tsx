'use client';

import { useQuery } from '@tanstack/react-query';
import { routinesService } from '@/services/routines.service';
import { Routine } from '@/types/routines';
import { DifficultyBadge, GoalBadge } from './routine-badge';
import { Activity, Calendar, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface RecentRoutinesProps {
  limit?: number;
}

export function RecentRoutines({ limit = 5 }: RecentRoutinesProps) {
  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['routines-recent', limit],
    queryFn: () => routinesService.getRecent(limit),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (routines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-4 bg-bone rounded-full mb-4">
          <Activity className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">No hay rutinas recientes</p>
        <p className="text-xs text-gray-400 mt-1">Las rutinas creadas aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {routines.map((routine) => (
        <RecentRoutineItem key={routine.id} routine={routine} />
      ))}
      <div className="pt-2">
        <Link
          href="/routines"
          className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
        >
          Ver todas las rutinas →
        </Link>
      </div>
    </div>
  );
}

interface RecentRoutineItemProps {
  routine: Routine;
}

function RecentRoutineItem({ routine }: RecentRoutineItemProps) {
  const dayCount = Object.keys(routine.weeklySchedule || {}).length;
  const totalExercises = Object.values(routine.weeklySchedule || {}).reduce(
    (acc, day) => acc + (day.exercises?.length || 0),
    0,
  );

  return (
    <Link href="/routines" className="block">
      <div className="p-3 bg-bone rounded-lg hover:bg-gray-100 transition-colors">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-dark text-sm truncate">{routine.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <DifficultyBadge difficulty={routine.difficulty} />
              <GoalBadge goal={routine.targetGoal} />
              {routine.isAIGenerated && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700">
                  ✨ IA
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400 shrink-0">
            {new Date(routine.updatedAt).toLocaleDateString('es-CR')}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{dayCount} días</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <span>{totalExercises} ejercicios</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{routine._count?.assignments || 0} asignados</span>
          </div>
        </div>
      </div>
    </Link>
  );
}