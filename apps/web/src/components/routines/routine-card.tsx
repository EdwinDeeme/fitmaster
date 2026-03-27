import { Routine, DIFFICULTY_LABELS, GOAL_LABELS } from '@/types/routines';
import { Pencil, Trash2, Target, BarChart2, Calendar, Dumbbell } from 'lucide-react';
import { MarqueeText } from '@/components/ui/marquee-text';

interface RoutineCardProps {
  routine: Routine;
  canEdit: boolean;
  onView: (routine: Routine) => void;
  onEdit: (routine: Routine) => void;
  onDelete: (routine: Routine) => void;
}

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

const DIFFICULTY_COLOR: Record<string, string> = {
  BEGINNER:     'text-emerald-500',
  INTERMEDIATE: 'text-amber-500',
  ADVANCED:     'text-rose-500',
};

const GOAL_COLOR: Record<string, string> = {
  WEIGHT_LOSS: 'text-sky-500',
  MUSCLE_GAIN: 'text-violet-500',
  MAINTENANCE: 'text-gray-400',
  STRENGTH:    'text-orange-500',
  ENDURANCE:   'text-teal-500',
};

function StatTile({
  icon, iconClass, label, value,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-bone rounded-xl p-3 flex items-center gap-3">
      <div className={`shrink-0 ${iconClass}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-gray-400 leading-none">{label}</p>
        <MarqueeText text={value} className="text-sm font-semibold text-dark mt-0.5 leading-tight" />
      </div>
    </div>
  );
}

export function RoutineCard({ routine, canEdit, onView, onEdit, onDelete }: RoutineCardProps) {
  const dayCount = Object.keys(routine.weeklySchedule || {}).length;
  const totalExercises = Object.values(routine.weeklySchedule || {}).reduce(
    (acc, day) => acc + (day.exercises?.length || 0), 0,
  );
  const client = routine.assignments?.[0]?.client;

  return (
    <div
      onClick={() => onView(routine)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-dark text-base truncate">{routine.name}</h3>
            {routine.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{routine.description}</p>
            )}
          </div>
          {canEdit && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={e => { e.stopPropagation(); onEdit(routine); }}
                className="p-1.5 rounded-lg hover:bg-bone transition-colors" aria-label="Editar">
                <Pencil className="h-4 w-4 text-gray-400" />
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(routine); }}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" aria-label="Eliminar">
                <Trash2 className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2×2 stat grid */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <StatTile
          icon={<BarChart2 className="h-4 w-4" />}
          iconClass={DIFFICULTY_COLOR[routine.difficulty]}
          label="Nivel"
          value={DIFFICULTY_LABELS[routine.difficulty]}
        />
        <StatTile
          icon={<Target className="h-4 w-4" />}
          iconClass={GOAL_COLOR[routine.targetGoal]}
          label="Objetivo"
          value={GOAL_LABELS[routine.targetGoal]}
        />
        <StatTile
          icon={<Calendar className="h-4 w-4" />}
          iconClass="text-primary-active"
          label="Días / semana"
          value={`${dayCount} días`}
        />
        <StatTile
          icon={<Dumbbell className="h-4 w-4" />}
          iconClass="text-primary-active"
          label="Ejercicios"
          value={`${totalExercises} ejercicios`}
        />
      </div>

      {/* Client panel */}
      <div className="px-4 pb-4">
        {client ? (
          <div className="bg-dark rounded-xl px-3 py-2.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-dark shrink-0">
              {client.firstName[0]}{client.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">
                {client.firstName.split(' ')[0]} {client.lastName.split(' ')[0]}
              </p>
              <div className="grid grid-cols-2 gap-x-3 mt-0.5">
                <span className="text-xs text-gray-400">Peso <span className="text-white font-medium">{client.weight} kg</span></span>
                <span className="text-xs text-gray-400">Altura <span className="text-white font-medium">{client.height} cm</span></span>
                <span className="text-xs text-gray-400">IMC <span className="text-white font-medium">{client.bmi ? Number(client.bmi).toFixed(1) : '—'}</span></span>
                <span className="text-xs text-gray-400">Edad <span className="text-white font-medium">{client.dateOfBirth ? calcAge(client.dateOfBirth) : '—'} años</span></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 px-3 py-3 flex items-center justify-center">
            <span className="text-xs text-gray-300">Sin cliente asignado</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 pt-3 flex items-center justify-between text-xs text-gray-400 border-t border-gray-50">
        <span>{routine.durationWeeks} semanas</span>
        <span>{new Date(routine.createdAt).toLocaleDateString('es-CR')}</span>
      </div>
    </div>
  );
}
