'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { equipmentService } from '@/services/equipment.service';
import { Equipment } from '@/types/gym';

interface Props { equipment: Equipment; onSuccess: () => void; onCancel: () => void; }

export function MaintenanceForm({ equipment, onSuccess, onCancel }: Props) {
  const { register, handleSubmit } = useForm();

  const mutation = useMutation({
    mutationFn: (data: any) => equipmentService.addMaintenance(equipment.id, data),
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
      <div className="bg-bone rounded-xl p-3">
        <p className="text-xs text-gray-500">Equipo</p>
        <p className="font-semibold text-dark">{equipment.name}</p>
      </div>
      <div className="space-y-1">
        <Label>Tipo de Mantenimiento</Label>
        <Select {...register('type', { required: true })}>
          <option value="">Seleccionar...</option>
          <option value="ROUTINE">Rutinario</option>
          <option value="REPAIR">Reparación</option>
          <option value="REPLACEMENT">Reemplazo de pieza</option>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Descripción</Label>
        <Textarea {...register('description', { required: true })} placeholder="Describe el mantenimiento realizado..." rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Costo (₡)</Label>
          <Input {...register('cost', { valueAsNumber: true })} type="number" placeholder="0" />
        </div>
        <div className="space-y-1">
          <Label>Realizado por</Label>
          <Input {...register('performedBy', { required: true })} placeholder="Nombre del técnico" />
        </div>
      </div>
      {mutation.isError && <p className="text-sm text-red-500">Error al registrar mantenimiento.</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Registrar'}</Button>
      </div>
    </form>
  );
}
