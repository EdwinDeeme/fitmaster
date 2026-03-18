'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { routinesService } from '@/services/routines.service';
import { Client, Routine } from '@/types/gym';

interface Props { routine: Routine; clients: Client[]; onSuccess: () => void; onCancel: () => void; }

export function AssignRoutineForm({ routine, clients, onSuccess, onCancel }: Props) {
  const { register, handleSubmit } = useForm({
    defaultValues: { startDate: new Date().toISOString().split('T')[0] },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => routinesService.assign({ ...data, routineId: routine.id }),
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
      <div className="bg-bone rounded-xl p-3">
        <p className="text-xs text-gray-500">Rutina</p>
        <p className="font-semibold text-dark">{routine.name}</p>
      </div>
      <div className="space-y-1">
        <Label>Cliente</Label>
        <Select {...register('clientId', { required: true })}>
          <option value="">Seleccionar cliente...</option>
          {clients.filter(c => c.status === 'ACTIVE').map(c => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Fecha de Inicio</Label>
        <Input {...register('startDate', { required: true })} type="date" />
      </div>
      {mutation.isError && <p className="text-sm text-red-500">Error al asignar rutina.</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Asignando...' : 'Asignar'}</Button>
      </div>
    </form>
  );
}
