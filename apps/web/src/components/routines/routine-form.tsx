'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { CreateRoutineData, WorkoutDay, GoalType } from '@/types/routines';
import { Client, Equipment } from '@/types/gym';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Plus, Loader2, Search, X, Dumbbell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { equipmentService } from '@/services/equipment.service';

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_KEYS     = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_ABBR     = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface ExerciseEntry {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  weight: string;
  equipmentId: string;
  days: string[];
}

const emptyDraft = () => ({
  name: '', sets: 3, reps: '10', restSeconds: 60, weight: '', equipmentId: '',
});

function buildWeeklySchedule(exercises: ExerciseEntry[]): Record<string, WorkoutDay> {
  const schedule: Record<string, WorkoutDay> = {};
  for (const ex of exercises) {
    for (const day of ex.days) {
      if (!schedule[day]) schedule[day] = { name: DAYS_OF_WEEK[DAY_KEYS.indexOf(day)], exercises: [] };
      schedule[day].exercises.push({
        name: ex.name, sets: ex.sets, reps: ex.reps,
        restSeconds: ex.restSeconds,
        notes: [ex.weight, ex.equipmentId].filter(Boolean).join('|') || undefined,
      });
    }
  }
  return schedule;
}

function parseWeeklySchedule(ws: Record<string, WorkoutDay>): ExerciseEntry[] {
  const map = new Map<string, ExerciseEntry>();
  for (const [dayKey, day] of Object.entries(ws)) {
    for (const ex of day.exercises) {
      const [weight = '', equipmentId = ''] = (ex.notes ?? '').split('|');
      const key = `${ex.name}|${ex.sets}|${ex.reps}|${ex.restSeconds}|${weight}|${equipmentId}`;
      if (map.has(key)) { map.get(key)!.days.push(dayKey); }
      else map.set(key, {
        id: Math.random().toString(36).slice(2),
        name: ex.name, sets: ex.sets, reps: String(ex.reps),
        restSeconds: ex.restSeconds, weight, equipmentId, days: [dayKey],
      });
    }
  }
  return map.size > 0 ? Array.from(map.values()) : [];
}

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

interface RoutineFormProps {
  initialData?: Partial<CreateRoutineData>;
  initialClientId?: string;
  onSubmit: (data: CreateRoutineData, clientId?: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  onHeaderChange?: (title: string, subtitle: string) => void;
}

export function RoutineForm({ initialData, initialClientId, onSubmit, onCancel, isLoading, onHeaderChange }: RoutineFormProps) {
  const [name, setName]               = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [targetGoal, setTargetGoal]   = useState<GoalType>(initialData?.targetGoal || 'MUSCLE_GAIN');
  const [durationWeeks, setDurationWeeks] = useState(initialData?.durationWeeks || 4);
  const [exercises, setExercises]     = useState<ExerciseEntry[]>(
    initialData?.weeklySchedule ? parseWeeklySchedule(initialData.weeklySchedule) : [],
  );
  const [draft, setDraft]         = useState(emptyDraft());
  const [draftDays, setDraftDays] = useState<string[]>([]);
  const [draftError, setDraftError] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');
  const [clientSearch, setClientSearch]         = useState('');
  const [clientDropOpen, setClientDropOpen]     = useState(false);
  const [error, setError] = useState('');

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients-list'],
    queryFn: async () => { const res = await api.get('/clients'); return res.data?.data || res.data || []; },
  });

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ['equipment'],
    queryFn: equipmentService.getAll,
  });

  const filteredClients = clients
    .filter(c => `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(clientSearch.toLowerCase()))
    .slice(0, 20);

  const selectedClient = clients.find(c => c.id === selectedClientId) ?? null;
  const effectiveName  = selectedClient
    ? `Rutina de ${selectedClient.firstName.split(' ')[0]}`
    : name;

  // Notify modal of header changes
  useEffect(() => {
    if (!onHeaderChange) return;
    const title = selectedClient
      ? `Rutina de ${selectedClient.firstName.split(' ')[0]}`
      : initialData?.name ? 'Editar rutina' : 'Nueva rutina';
    const subtitle = selectedClient
      ? description.trim() || 'Crea una rutina de entrenamiento personalizada'
      : initialData?.name ? 'Modifica los datos de la rutina' : 'Crea una rutina de entrenamiento personalizada';
    onHeaderChange(title, subtitle);
  }, [selectedClient, description, onHeaderChange, initialData?.name]);

  const toggleDraftDay = (day: string) =>
    setDraftDays(p => p.includes(day) ? p.filter(d => d !== day) : [...p, day]);

  const addExercise = () => {
    setDraftError('');
    if (!draft.name.trim()) return setDraftError('El nombre es requerido');
    if (draftDays.length === 0) return setDraftError('Selecciona al menos un día');
    if (draft.sets < 1) return setDraftError('Sets debe ser mayor a 0');
    setExercises(p => [...p, { ...draft, id: Math.random().toString(36).slice(2), days: draftDays }]);
    setDraft(emptyDraft());
    setDraftDays([]);
  };

  const removeExercise = (id: string) => setExercises(p => p.filter(e => e.id !== id));

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');
    if (!effectiveName.trim()) return setError('El nombre es requerido');
    if (exercises.length === 0) return setError('Agrega al menos un ejercicio');
    const weeklySchedule = buildWeeklySchedule(exercises);
    // Sanitize: ensure all numeric fields are proper integers
    for (const day of Object.values(weeklySchedule)) {
      for (const ex of day.exercises) {
        ex.sets = Math.floor(Number(ex.sets));
        ex.restSeconds = Math.floor(Number(ex.restSeconds));
        ex.reps = isNaN(Number(ex.reps)) ? ex.reps : Number(ex.reps);
      }
    }
    await onSubmit(
      { name: effectiveName, description, targetGoal, difficulty: 'BEGINNER', durationWeeks: Math.floor(durationWeeks), weeklySchedule },
      selectedClientId || undefined,
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Cliente + panel info ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <div className="relative">
            <button type="button" onClick={() => setClientDropOpen(o => !o)}
              className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <span className={selectedClient ? 'text-dark truncate' : 'text-gray-400'}>
                {selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : 'Seleccionar cliente...'}
              </span>
              <Search className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
            </button>
            {clientDropOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input autoFocus value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                    placeholder="Buscar..." className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <ul className="max-h-44 overflow-y-auto">
                  <li>
                    <button type="button" onClick={() => { setSelectedClientId(''); setClientDropOpen(false); setClientSearch(''); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-bone transition-colors">Sin cliente</button>
                  </li>
                  {filteredClients.map(c => (
                    <li key={c.id}>
                      <button type="button" onClick={() => { setSelectedClientId(c.id); setClientDropOpen(false); setClientSearch(''); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-bone transition-colors ${selectedClientId === c.id ? 'bg-primary/10 font-medium' : ''}`}>
                        <span className="text-dark">{c.firstName} {c.lastName}</span>
                        <span className="text-gray-400 ml-1.5 text-xs">{c.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {selectedClient ? (
          <div className="bg-dark rounded-xl px-3 py-2 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-dark shrink-0">
              {selectedClient.firstName[0]}{selectedClient.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">{selectedClient.firstName} {selectedClient.lastName}</p>
              <div className="grid grid-cols-2 gap-x-2 mt-0.5">
                <span className="text-xs text-gray-400">Peso: <span className="text-white font-medium">{selectedClient.weight} kg</span></span>
                <span className="text-xs text-gray-400">Altura: <span className="text-white font-medium">{selectedClient.height} cm</span></span>
                <span className="text-xs text-gray-400">IMC: <span className="text-white font-medium">{Number(selectedClient.bmi).toFixed(1)}</span></span>
                <span className="text-xs text-gray-400">Edad: <span className="text-white font-medium">{calcAge(selectedClient.dateOfBirth)} años</span></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-300">Sin cliente seleccionado</span>
          </div>
        )}
      </div>

      {/* ── Nombre / Descripción ── */}
      {selectedClient ? (
        <div className="space-y-1.5">
          <Label>Descripción</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Objetivo y enfoque de la rutina..." className="h-10" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej: Rutina de fuerza 3 días" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Objetivo y enfoque..." className="h-10" />
          </div>
        </div>
      )}

      {/* ── Objetivo + Duración ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Objetivo</Label>
          <Select value={targetGoal} onChange={e => setTargetGoal(e.target.value as GoalType)}>
            <option value="WEIGHT_LOSS">Pérdida de peso</option>
            <option value="MUSCLE_GAIN">Ganancia muscular</option>
            <option value="MAINTENANCE">Mantenimiento</option>
            <option value="STRENGTH">Fuerza</option>
            <option value="ENDURANCE">Resistencia</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Duración (semanas)</Label>
          <Input type="number" min={1} max={52} value={durationWeeks}
            onChange={e => setDurationWeeks(Number(e.target.value))} className="h-10" />
        </div>
      </div>

      {/* ── Add exercise form ── */}
      <div className="space-y-2">
        <Label>Agregar ejercicio</Label>
        <div className="bg-bone rounded-xl p-3 space-y-2">
          {/* Nombre */}
          <Input placeholder="Nombre del ejercicio *" value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            className="h-9 text-sm bg-white" />

          {/* Sets / Reps / Desc / Peso */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <div className="space-y-0.5">
              <label className="text-xs text-gray-500 block text-center">Sets</label>
              <Input type="number" min={1} value={draft.sets}
                onChange={e => setDraft(d => ({ ...d, sets: Number(e.target.value) }))}
                className="h-8 text-sm text-center px-1 bg-white" />
            </div>
            <div className="space-y-0.5">
              <label className="text-xs text-gray-500 block text-center">Reps</label>
              <Input value={draft.reps} onChange={e => setDraft(d => ({ ...d, reps: e.target.value }))}
                placeholder="10" className="h-8 text-sm text-center px-1 bg-white" />
            </div>
            <div className="space-y-0.5">
              <label className="text-xs text-gray-500 block text-center">Desc (s)</label>
              <Input type="number" min={0} value={draft.restSeconds}
                onChange={e => setDraft(d => ({ ...d, restSeconds: Number(e.target.value) }))}
                className="h-8 text-sm text-center px-1 bg-white" />
            </div>
            <div className="space-y-0.5">
              <label className="text-xs text-gray-500 block text-center">Peso</label>
              <Input value={draft.weight} onChange={e => setDraft(d => ({ ...d, weight: e.target.value }))}
                placeholder="50 kg" className="h-8 text-sm text-center px-1 bg-white" />
            </div>
          </div>

          {/* Máquina */}
          <Select value={draft.equipmentId} onChange={e => setDraft(d => ({ ...d, equipmentId: e.target.value }))}>
            <option value="">Sin equipo específico</option>
            {equipment.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name}{eq.brand ? ` — ${eq.brand}` : ''}</option>
            ))}
          </Select>

          {/* Días + botón */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {DAY_KEYS.map((key, i) => {
                const active = draftDays.includes(key);
                return (
                  <button key={key} type="button" onClick={() => toggleDraftDay(key)} title={DAYS_OF_WEEK[i]}
                    className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${active ? 'bg-primary text-dark' : 'bg-white text-gray-500 hover:bg-gray-200 border border-gray-200'}`}>
                    {DAY_ABBR[i]}
                  </button>
                );
              })}
            </div>
            <div className="flex-1" />
            <Button type="button" size="sm" onClick={addExercise} className="h-7 px-3 text-xs gap-1">
              <Plus className="h-3.5 w-3.5" /> Agregar
            </Button>
          </div>

          {draftError && <p className="text-xs text-red-500">{draftError}</p>}
        </div>
      </div>

      {/* ── Weekly schedule grid ── */}
      {exercises.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
          {DAY_KEYS.map((key, i) => {
            const dayExercises = exercises.filter(e => e.days.includes(key));
            const hasExercises = dayExercises.length > 0;
            return (
              <div key={key} className="flex flex-col gap-1">
                <div className={`text-center text-xs font-bold py-1.5 rounded-lg ${hasExercises ? 'bg-primary text-dark' : 'bg-bone text-gray-400'}`}>
                  {DAY_ABBR[i]}
                  {hasExercises && <span className="block text-xs font-normal opacity-60">{dayExercises.length}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  {dayExercises.map(ex => (
                    <ExerciseChip key={ex.id} exercise={ex} equipment={equipment} onRemove={() => removeExercise(ex.id)} />
                  ))}
                  {!hasExercises && <div className="min-h-[48px] rounded-lg border border-dashed border-gray-100" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {initialData?.name ? 'Guardar cambios' : 'Crear rutina'}
        </Button>
      </div>
    </form>
  );
}

// ── Exercise chip with portal-based popover — never causes scroll ──
function ExerciseChip({ exercise, equipment, onRemove }: {
  exercise: ExerciseEntry;
  equipment: Equipment[];
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [popStyle, setPopStyle] = useState<React.CSSProperties>({ display: 'none' });
  const eq = equipment.find(e => e.id === exercise.equipmentId);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const popWidth = 192; // w-48
    const spaceRight = window.innerWidth - rect.right;
    const left = spaceRight >= popWidth ? rect.left : Math.max(8, rect.right - popWidth);
    const spaceBelow = window.innerHeight - rect.top;
    const popHeight = 180;
    const top = spaceBelow >= popHeight + 8 ? rect.bottom + 4 : rect.top - popHeight - 4;
    setPopStyle({ position: 'fixed', top, left, width: popWidth, zIndex: 99999 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [open]);

  return (
    <>
      <button ref={btnRef} type="button" onClick={() => setOpen(o => !o)}
        className={`w-full text-left bg-white border rounded-lg px-2 py-1.5 transition-colors hover:border-primary/50 ${open ? 'border-primary/50' : 'border-gray-200'}`}>
        <p className="text-xs font-semibold text-dark leading-tight truncate">{exercise.name}</p>
        <p className="text-xs text-gray-400 leading-tight">{exercise.sets}×{exercise.reps}</p>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div ref={popRef} style={popStyle} className="bg-white rounded-xl border border-gray-200 shadow-xl p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-bold text-dark leading-tight">{exercise.name}</p>
            <button type="button" onClick={() => setOpen(false)}
              className="p-0.5 rounded hover:bg-bone shrink-0">
              <X className="h-3 w-3 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <span className="text-xs text-gray-400">Sets <span className="text-dark font-medium">{exercise.sets}</span></span>
            <span className="text-xs text-gray-400">Reps <span className="text-dark font-medium">{exercise.reps}</span></span>
            <span className="text-xs text-gray-400">Desc <span className="text-dark font-medium">{exercise.restSeconds}s</span></span>
            {exercise.weight && (
              <span className="text-xs text-gray-400">Peso <span className="text-dark font-medium">{exercise.weight}</span></span>
            )}
          </div>
          {eq && (
            <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-gray-100">
              <Dumbbell className="h-3 w-3 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 truncate">{eq.name}</span>
            </div>
          )}
          <button type="button" onClick={() => { onRemove(); setOpen(false); }}
            className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg py-1 transition-colors">
            Eliminar ejercicio
          </button>
        </div>,
        document.body,
      )}
    </>
  );
}
