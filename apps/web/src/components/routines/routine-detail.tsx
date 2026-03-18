'use client';

import { Badge } from '@/components/ui/badge';
import { Routine } from '@/types/gym';

const goalLabels: Record<string, string> = { WEIGHT_LOSS: 'Pérdida de peso', MUSCLE_GAIN: 'Ganancia muscular', MAINTENANCE: 'Mantenimiento', STRENGTH: 'Fuerza', ENDURANCE: 'Resistencia' };
const difficultyConfig: Record<string, { label: string; variant: any }> = { BEGINNER: { label: 'Principiante', variant: 'success' }, INTERMEDIATE: { label: 'Intermedio', variant: 'warning' }, ADVANCED: { label: 'Avanzado', variant: 'danger' } };

export function RoutineDetail({ routine }: { routine: Routine }) {
  return (
    <div className="p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xl font-bold text-dark">{routine.name}</h3>
          <Badge variant={difficultyConfig[routine.difficulty]?.variant}>{difficultyConfig[routine.difficulty]?.label}</Badge>
          {routine.isAIGenerated && <Badge variant="info">Generada con IA</Badge>}
        </div>
        {routine.description && <p className="text-gray-500 mt-1">{routine.description}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Objetivo', value: goalLabels[routine.targetGoal] },
          { label: 'Duración', value: `${routine.durationWeeks} semanas` },
          { label: 'Creada por', value: `${routine.creator?.firstName} ${routine.creator?.lastName}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-bone rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-semibold text-dark text-sm">{value}</p>
          </div>
        ))}
      </div>

      {routine.assignments && routine.assignments.length > 0 && (
        <div>
          <p className="font-semibold text-dark mb-2">Clientes Asignados ({routine.assignments.length})</p>
          <div className="space-y-2">
            {routine.assignments.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-bone rounded-xl p-3">
                <div>
                  <p className="font-medium text-dark text-sm">{a.client?.firstName} {a.client?.lastName}</p>
                  <p className="text-xs text-gray-500">{a.client?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Desde</p>
                  <p className="text-xs font-medium">{new Date(a.startDate).toLocaleDateString('es-CR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
