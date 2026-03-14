import { Routine } from '@/types/routines';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DifficultyBadge, GoalBadge } from './routine-badge';
import { Calendar, Users, Dumbbell, MoreVertical, Eye, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface RoutineCardProps {
  routine: Routine;
  canEdit: boolean;
  onView: (routine: Routine) => void;
  onAssign: (routine: Routine) => void;
  onEdit: (routine: Routine) => void;
  onDelete: (routine: Routine) => void;
}

export function RoutineCard({ routine, canEdit, onView, onAssign, onEdit, onDelete }: RoutineCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const dayCount = Object.keys(routine.weeklySchedule || {}).length;
  const totalExercises = Object.values(routine.weeklySchedule || {}).reduce(
    (acc, day) => acc + (day.exercises?.length || 0),
    0,
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-dark text-base truncate">{routine.name}</h3>
            {routine.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{routine.description}</p>
            )}
          </div>
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-bone transition-colors"
              aria-label="Opciones"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
                <button
                  onClick={() => { onView(routine); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-dark hover:bg-bone transition-colors"
                >
                  <Eye className="h-4 w-4" /> Ver detalle
                </button>
                <button
                  onClick={() => { onAssign(routine); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-dark hover:bg-bone transition-colors"
                >
                  <UserPlus className="h-4 w-4" /> Asignar cliente
                </button>
                {canEdit && (
                  <>
                    <button
                      onClick={() => { onEdit(routine); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-dark hover:bg-bone transition-colors"
                    >
                      <Pencil className="h-4 w-4" /> Editar
                    </button>
                    <button
                      onClick={() => { onDelete(routine); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" /> Eliminar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <DifficultyBadge difficulty={routine.difficulty} />
          <GoalBadge goal={routine.targetGoal} />
          {routine.isAIGenerated && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700">
              ✨ IA
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col items-center p-2 bg-bone rounded-lg">
            <Calendar className="h-4 w-4 text-gray-500 mb-1" />
            <span className="text-sm font-bold text-dark">{dayCount}</span>
            <span className="text-xs text-gray-500">días/sem</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-bone rounded-lg">
            <Dumbbell className="h-4 w-4 text-gray-500 mb-1" />
            <span className="text-sm font-bold text-dark">{totalExercises}</span>
            <span className="text-xs text-gray-500">ejercicios</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-bone rounded-lg">
            <Users className="h-4 w-4 text-gray-500 mb-1" />
            <span className="text-sm font-bold text-dark">{routine._count?.assignments || 0}</span>
            <span className="text-xs text-gray-500">asignados</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{routine.durationWeeks} semanas</span>
          <span>{new Date(routine.createdAt).toLocaleDateString('es-CR')}</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full mt-3"
          onClick={() => onAssign(routine)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Asignar a cliente
        </Button>
      </CardContent>
    </Card>
  );
}
