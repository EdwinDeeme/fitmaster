'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { routinesService } from '@/services/routines.service';
import { Routine } from '@/types/gym';

interface Props { routine?: Routine; onSuccess: () => void; onCancel: () => void; }

export function RoutineForm({ routine, onSuccess, onCancel }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: routine ?? {} });

  const mutation = useMutation({
    mutationFn: (data: any) => routine ? routinesService.update(routine.id, data) : routinesService.create(data),
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
      <div className="space-y-1">
        <Label>Nombre de la Rutina</Label>
        <Input {...register('name', { required: true })} placeholder="Ej: Rutina de Fuerza 3x/semana" />
      </div>
      <div className="space-y-1">
        <Label>Descripción</Label>
        <Textarea {...register('description')} placeholder="Descripción de la rutina..." rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Objetivo</Label>
          <Select {...register('targetGoal', { required: true })}>
            <option value="">Seleccionar...</option>
            <option value="WEIGHT_LOSS">Pérdida de peso</option>
            <option value="MUSCLE_GAIN">Ganancia muscular</option>
            <option value="MAINTENANCE">Mantenimiento</option>
            <option value="STRENGTH">Fuerza</option>
            <option value="ENDURANCE">Resistencia</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Dificultad</Label>
          <Select {...register('difficulty', { required: true })}>
            <option value="">Seleccionar...</option>
            <option value="BEGINNER">Principiante</option>
            <option value="INTERMEDIATE">Intermedio</option>
            <option value="ADVANCED">Avanzado</option>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Duración (semanas)</Label>
        <Input {...register('durationWeeks', { required: true, valueAsNumber: true })} type="number" min={1} placeholder="8" />
      </div>
      {mutation.isError && <p className="text-sm text-red-500">Error al guardar la rutina.</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : routine ? 'Actualizar' : 'Crear Rutina'}</Button>
      </div>
    </form>
  );
}
