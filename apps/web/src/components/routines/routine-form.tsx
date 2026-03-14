'use client';

import { useState } from 'react';
import { CreateRoutineData, WorkoutDay, Exercise, GoalType, DifficultyLevel } from '@/types/routines';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const emptyExercise = (): Exercise => ({
  name: '',
  sets: 3,
  reps: 10,
  restSeconds: 60,
  notes: '',
  muscleGroups: [],
});

interface RoutineFormProps {
  initialData?: Partial<CreateRoutineData>;
  onSubmit: (data: CreateRoutineData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RoutineForm({ initialData, onSubmit, onCancel, isLoading }: RoutineFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [targetGoal, setTargetGoal] = useState<GoalType>(initialData?.targetGoal || 'MUSCLE_GAIN');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialData?.difficulty || 'BEGINNER');
  const [durationWeeks, setDurationWeeks] = useState(initialData?.durationWeeks || 4);
  const [schedule, setSchedule] = useState<Record<string, WorkoutDay>>(
    initialData?.weeklySchedule || {},
  );
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const toggleDay = (key: string, label: string) => {
    if (schedule[key]) {
      const updated = { ...schedule };
      delete updated[key];
      setSchedule(updated);
    } else {
      setSchedule({ ...schedule, [key]: { name: label, exercises: [emptyExercise()] } });
      setExpandedDays({ ...expandedDays, [key]: true });
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedDays({ ...expandedDays, [key]: !expandedDays[key] });
  };

  const addExercise = (dayKey: string) => {
    setSchedule({
      ...schedule,
      [dayKey]: {
        ...schedule[dayKey],
        exercises: [...schedule[dayKey].exercises, emptyExercise()],
      },
    });
  };

  const removeExercise = (dayKey: string, idx: number) => {
    const exercises = schedule[dayKey].exercises.filter((_, i) => i !== idx);
    setSchedule({ ...schedule, [dayKey]: { ...schedule[dayKey], exercises } });
  };

  const updateExercise = (dayKey: string, idx: number, field: keyof Exercise, value: any) => {
    const exercises = schedule[dayKey].exercises.map((ex, i) =>
      i === idx ? { ...ex, [field]: value } : ex,
    );
    setSchedule({ ...schedule, [dayKey]: { ...schedule[dayKey], exercises } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('El nombre es requerido');
    if (Object.keys(schedule).length === 0) return setError('Agrega al menos un día de entrenamiento');

    for (const [, day] of Object.entries(schedule)) {
      for (const ex of day.exercises) {
        if (!ex.name.trim()) return setError('Todos los ejercicios deben tener nombre');
        if (ex.sets < 1) return setError('Los sets deben ser mayor a 0');
      }
    }

    await onSubmit({ name, description, targetGoal, difficulty, durationWeeks, weeklySchedule: schedule });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="name">Nombre de la rutina *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Rutina de fuerza 3 días"
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el objetivo y enfoque de la rutina..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetGoal">Objetivo</Label>
          <Select
            id="targetGoal"
            value={targetGoal}
            onChange={(e) => setTargetGoal(e.target.value as GoalType)}
          >
            <option value="WEIGHT_LOSS">Pérdida de peso</option>
            <option value="MUSCLE_GAIN">Ganancia muscular</option>
            <option value="MAINTENANCE">Mantenimiento</option>
            <option value="STRENGTH">Fuerza</option>
            <option value="ENDURANCE">Resistencia</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Dificultad</Label>
          <Select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
          >
            <option value="BEGINNER">Principiante</option>
            <option value="INTERMEDIATE">Intermedio</option>
            <option value="ADVANCED">Avanzado</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="durationWeeks">Duración (semanas)</Label>
          <Input
            id="durationWeeks"
            type="number"
            min={1}
            max={52}
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Weekly schedule */}
      <div className="space-y-3">
        <Label>Días de entrenamiento *</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((label, i) => {
            const key = DAY_KEYS[i];
            const active = !!schedule[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleDay(key, label)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-dark'
                    : 'bg-bone text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Day exercises */}
        <div className="space-y-3">
          {DAY_KEYS.map((key, i) => {
            if (!schedule[key]) return null;
            const day = schedule[key];
            const expanded = expandedDays[key] !== false;

            return (
              <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleExpand(key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-bone hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-dark text-sm">
                    {DAYS_OF_WEEK[i]} — {day.exercises.length} ejercicio{day.exercises.length !== 1 ? 's' : ''}
                  </span>
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>

                {expanded && (
                  <div className="p-4 space-y-3">
                    {day.exercises.map((ex, idx) => (
                      <ExerciseRow
                        key={idx}
                        exercise={ex}
                        index={idx}
                        onChange={(field, value) => updateExercise(key, idx, field, value)}
                        onRemove={() => removeExercise(key, idx)}
                        canRemove={day.exercises.length > 1}
                      />
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addExercise(key)}
                      className="w-full border border-dashed border-gray-300 hover:border-primary hover:text-primary"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Agregar ejercicio
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {initialData?.name ? 'Guardar cambios' : 'Crear rutina'}
        </Button>
      </div>
    </form>
  );
}

// Sub-component for each exercise row
interface ExerciseRowProps {
  exercise: Exercise;
  index: number;
  onChange: (field: keyof Exercise, value: any) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function ExerciseRow({ exercise, index, onChange, onRemove, canRemove }: ExerciseRowProps) {
  return (
    <div className="bg-bone rounded-xl p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-400 w-5 shrink-0">#{index + 1}</span>
        <Input
          placeholder="Nombre del ejercicio *"
          value={exercise.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="flex-1 h-9 text-sm"
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
            aria-label="Eliminar ejercicio"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Sets</label>
          <Input
            type="number"
            min={1}
            value={exercise.sets}
            onChange={(e) => onChange('sets', Number(e.target.value))}
            className="h-9 text-sm text-center"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Reps</label>
          <Input
            value={String(exercise.reps)}
            onChange={(e) => onChange('reps', e.target.value)}
            placeholder="10 o 8-12"
            className="h-9 text-sm text-center"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Descanso (s)</label>
          <Input
            type="number"
            min={0}
            value={exercise.restSeconds}
            onChange={(e) => onChange('restSeconds', Number(e.target.value))}
            className="h-9 text-sm text-center"
          />
        </div>
      </div>

      <Input
        placeholder="Notas opcionales..."
        value={exercise.notes || ''}
        onChange={(e) => onChange('notes', e.target.value)}
        className="h-9 text-sm"
      />
    </div>
  );
}
