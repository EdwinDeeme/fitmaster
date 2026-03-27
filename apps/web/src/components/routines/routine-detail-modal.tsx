'use client';

import { Routine, DIFFICULTY_LABELS, GOAL_LABELS } from '@/types/routines';
import { X, Pencil, Target, BarChart2, Calendar, Dumbbell, TrendingUp, History } from 'lucide-react';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MarqueeText } from '@/components/ui/marquee-text';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentService } from '@/services/equipment.service';
import { Equipment } from '@/types/gym';
import { motion, useReducedMotion } from 'framer-motion';
import { routinesService } from '@/services/routines.service';
import { ExerciseLog } from '@/types/routines';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_ABBR = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

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

function StatTile({ icon, iconClass, label, value }: {
  icon: React.ReactNode; iconClass: string; label: string; value: string;
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

interface RoutineDetailModalProps {
  routine: Routine;
  onClose: () => void;
  onEdit?: (routine: Routine) => void;
  clientId?: string; // if opened from client tracking
}

export function RoutineDetailModal({ routine, onClose, onEdit, clientId }: RoutineDetailModalProps) {
  const days = Object.entries(routine.weeklySchedule || {});
  const client = routine.assignments?.[0]?.client;
  const prefersReducedMotion = useReducedMotion();

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ['equipment'],
    queryFn: equipmentService.getAll,
  });

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
        <div className="flex items-start justify-between p-6 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-dark truncate">{routine.name}</h2>
            {routine.description && (
              <p className="text-sm text-gray-500 mt-1">{routine.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-4 shrink-0">
            {onEdit && (
              <button onClick={() => { onClose(); onEdit(routine); }}
                className="p-2 rounded-lg hover:bg-bone transition-colors" aria-label="Editar">
                <Pencil className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <button onClick={onClose}
              className="p-2 rounded-lg hover:bg-bone transition-colors" aria-label="Cerrar">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Stats (2×2) + client panel side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid grid-cols-2 gap-2">
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
                label="Duración"
                value={`${routine.durationWeeks} sem`}
              />
              <StatTile
                icon={<Dumbbell className="h-4 w-4" />}
                iconClass="text-primary-active"
                label="Días/sem"
                value={`${days.length} días`}
              />
            </div>

            {/* Client panel */}
            {client ? (
              <div className="bg-dark rounded-xl px-3 py-2.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-sm font-bold text-dark shrink-0">
                  {client.firstName[0]}{client.lastName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-semibold truncate">
                    {client.firstName.split(' ')[0]} {client.lastName.split(' ')[0]}
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 mt-1">
                    <span className="text-xs text-gray-400">Peso <span className="text-white font-medium">{client.weight} kg</span></span>
                    <span className="text-xs text-gray-400">Altura <span className="text-white font-medium">{client.height} cm</span></span>
                    <span className="text-xs text-gray-400">IMC <span className="text-white font-medium">{client.bmi ? Number(client.bmi).toFixed(1) : '—'}</span></span>
                    <span className="text-xs text-gray-400">Edad <span className="text-white font-medium">{client.dateOfBirth ? calcAge(client.dateOfBirth) : '—'} años</span></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-300">Sin cliente asignado</span>
              </div>
            )}
          </div>

          {/* Weekly schedule grid */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Horario semanal</p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {DAY_KEYS.map((key, i) => {
                const day = routine.weeklySchedule?.[key];
                const exs = day?.exercises || [];
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <div className={`text-center text-xs font-bold py-1.5 rounded-lg ${exs.length > 0 ? 'bg-primary text-dark' : 'bg-bone text-gray-400'}`}>
                      {DAY_ABBR[i]}
                      {exs.length > 0 && <span className="block text-xs font-normal opacity-60">{exs.length}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                      {exs.map((ex, idx) => (
                        <ExerciseChipDetail key={idx} exercise={ex} equipment={equipment}
                          clientId={clientId} routineId={routine.id} />
                      ))}
                      {exs.length === 0 && (
                        <div className="min-h-[48px] rounded-lg border border-dashed border-gray-100" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

// Chip with portal-based popover — never causes horizontal scroll
function ExerciseChipDetail({ exercise, equipment, clientId, routineId }: {
  exercise: any; equipment: Equipment[]; clientId?: string; routineId?: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'info' | 'update' | 'history'>('info');
  const [newWeight, setNewWeight] = useState('');
  const [newSets, setNewSets] = useState('');
  const [newReps, setNewReps] = useState('');
  const [newWeek, setNewWeek] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [popStyle, setPopStyle] = useState<React.CSSProperties>({ display: 'none' });

  const [weight, equipmentId] = (exercise.notes ?? '').split('|');
  const eq = equipmentId ? equipment.find(e => e.id === equipmentId) : null;

  // Fetch logs for this exercise if clientId is available
  const { data: logsGrouped = {} } = useQuery<Record<string, ExerciseLog[]>>({
    queryKey: ['exercise-logs', clientId, routineId],
    queryFn: () => routinesService.getExerciseLogs(clientId!, routineId!),
    enabled: !!clientId && !!routineId && open,
  });
  const exerciseLogs: ExerciseLog[] = logsGrouped[exercise.name] ?? [];
  const lastLog = exerciseLogs[exerciseLogs.length - 1];

  const logMutation = useMutation({
    mutationFn: (dto: any) => routinesService.logExercise(clientId!, routineId!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercise-logs', clientId, routineId] });
      setView('info');
      setNewWeight(''); setNewSets(''); setNewReps(''); setNewWeek('');
    },
  });

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const popWidth = 220;
    const spaceRight = window.innerWidth - rect.right;
    const left = spaceRight >= popWidth ? rect.left : Math.max(8, rect.right - popWidth);
    const spaceBelow = window.innerHeight - rect.top;
    const popHeight = view === 'history' ? 280 : view === 'update' ? 240 : 180;
    const top = spaceBelow >= popHeight + 8 ? rect.bottom + 4 : rect.top - popHeight - 4;
    setPopStyle({ position: 'fixed', top, left, width: popWidth, zIndex: 99999 });
  }, [open, view]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false); setView('info');
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [open]);

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || !clientId || !routineId) return;
    logMutation.mutate({
      exerciseName: exercise.name,
      sets: parseInt(newSets) || exercise.sets,
      reps: newReps || String(exercise.reps),
      weightKg: parseFloat(newWeight),
      weekNumber: newWeek ? parseInt(newWeek) : undefined,
    });
  };

  return (
    <>
      <button ref={btnRef} type="button" onClick={() => setOpen(o => !o)}
        className={`w-full text-left bg-white border rounded-lg px-2 py-1.5 transition-colors hover:border-primary/50 ${open ? 'border-primary/50' : 'border-gray-200'}`}>
        <p className="text-xs font-semibold text-dark leading-tight truncate">{exercise.name}</p>
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs text-gray-400 leading-tight">{exercise.sets}×{exercise.reps}</p>
          {lastLog && clientId && (
            <p className="text-[10px] text-primary font-semibold">{lastLog.weightKg}kg</p>
          )}
          {!lastLog && weight && (
            <p className="text-[10px] text-gray-400">{weight}</p>
          )}
        </div>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div ref={popRef} style={popStyle}
          className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">

          {/* Popover header */}
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-100 bg-bone">
            <p className="text-xs font-bold text-dark truncate flex-1">{exercise.name}</p>
            <button type="button" onClick={() => { setOpen(false); setView('info'); }}
              className="p-0.5 rounded hover:bg-gray-200 shrink-0">
              <X className="h-3 w-3 text-gray-400" />
            </button>
          </div>

          {/* View: info */}
          {view === 'info' && (
            <div className="p-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="text-xs text-gray-400">Series <span className="text-dark font-medium">{exercise.sets}</span></span>
                <span className="text-xs text-gray-400">Reps <span className="text-dark font-medium">{exercise.reps}</span></span>
                <span className="text-xs text-gray-400">Desc <span className="text-dark font-medium">{exercise.restSeconds}s</span></span>
                <span className="text-xs text-gray-400">
                  Peso <span className="text-dark font-medium">
                    {lastLog ? `${lastLog.weightKg} kg` : weight || '—'}
                  </span>
                </span>
              </div>
              {eq && (
                <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
                  <Dumbbell className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{eq.name}</span>
                </div>
              )}
              {exercise.muscleGroups?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100">
                  {exercise.muscleGroups.map((mg: string) => (
                    <span key={mg} className="text-xs bg-bone text-gray-500 rounded px-1.5 py-0.5">{mg}</span>
                  ))}
                </div>
              )}
              {/* Action buttons — only if clientId provided */}
              {clientId && routineId && (
                <div className="flex gap-1.5 pt-1 border-t border-gray-100">
                  <button onClick={() => setView('update')}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-dark text-xs font-semibold hover:bg-primary-hover transition-colors">
                    <TrendingUp className="h-3 w-3" />
                    Actualizar
                  </button>
                  <button onClick={() => setView('history')}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-bone text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors">
                    <History className="h-3 w-3" />
                    Historial
                  </button>
                </div>
              )}
            </div>
          )}

          {/* View: update weight */}
          {view === 'update' && (
            <form onSubmit={handleLog} className="p-3 space-y-2">
              <button type="button" onClick={() => setView('info')}
                className="text-[10px] text-gray-400 hover:text-dark flex items-center gap-1">
                ← Volver
              </button>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Peso (kg) *</label>
                  <input type="number" step="0.5" required value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    placeholder={lastLog ? `${lastLog.weightKg}` : weight || '0'}
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Semana</label>
                  <input type="number" min="1" value={newWeek}
                    onChange={e => setNewWeek(e.target.value)} placeholder="1"
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Series</label>
                  <input type="number" min="1" value={newSets}
                    onChange={e => setNewSets(e.target.value)} placeholder={String(exercise.sets)}
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Reps</label>
                  <input type="text" value={newReps}
                    onChange={e => setNewReps(e.target.value)} placeholder={String(exercise.reps)}
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-primary" />
                </div>
              </div>
              <button type="submit" disabled={logMutation.isPending || !newWeight}
                className="w-full h-8 bg-primary text-dark text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                {logMutation.isPending
                  ? <div className="w-3.5 h-3.5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                  : <><TrendingUp className="h-3 w-3" /> Guardar</>}
              </button>
            </form>
          )}

          {/* View: history */}
          {view === 'history' && (
            <div className="p-3 space-y-2">
              <button type="button" onClick={() => setView('info')}
                className="text-[10px] text-gray-400 hover:text-dark flex items-center gap-1">
                ← Volver
              </button>
              {exerciseLogs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">Sin registros aún</p>
              ) : (
                <div className="overflow-y-auto max-h-44">
                  <table className="w-full">
                    <thead className="bg-bone">
                      <tr>
                        {['Fecha', 'Peso', 'Sem'].map(h => (
                          <th key={h} className="px-2 py-1.5 text-left text-[9px] font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...exerciseLogs].reverse().map(l => (
                        <tr key={l.id} className="hover:bg-bone/50">
                          <td className="px-2 py-1.5 text-[10px] text-gray-600 whitespace-nowrap">
                            {(() => { try { return new Date(l.date).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' }); } catch { return l.date; } })()}
                          </td>
                          <td className="px-2 py-1.5 text-[10px] font-bold text-dark">{l.weightKg} kg</td>
                          <td className="px-2 py-1.5 text-[10px] text-gray-600">{l.weekNumber ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
