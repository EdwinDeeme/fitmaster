'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { financesService } from '@/services/finances.service';

interface Props { onSuccess: () => void; onCancel: () => void; }

export function ExpenseForm({ onSuccess, onCancel }: Props) {
  const { register, handleSubmit } = useForm({
    defaultValues: { date: new Date().toISOString().split('T')[0], currency: 'CRC' },
  });

  const mutation = useMutation({ mutationFn: financesService.createExpense, onSuccess });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
      <div className="space-y-1">
        <Label>Descripción</Label>
        <Input {...register('description', { required: true })} placeholder="Ej: Pago de alquiler" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Monto (₡)</Label>
          <Input {...register('amount', { required: true, valueAsNumber: true })} type="number" placeholder="50000" />
        </div>
        <div className="space-y-1">
          <Label>Categoría</Label>
          <Select {...register('category', { required: true })}>
            <option value="">Seleccionar...</option>
            <option value="RENT">Alquiler</option>
            <option value="UTILITIES">Servicios (agua, luz, internet)</option>
            <option value="EQUIPMENT">Equipamiento</option>
            <option value="SALARIES">Salarios</option>
            <option value="MAINTENANCE">Mantenimiento</option>
            <option value="MARKETING">Marketing</option>
            <option value="SUPPLIES">Suministros</option>
            <option value="OTHER">Otro</option>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Fecha</Label>
        <Input {...register('date', { required: true })} type="date" />
      </div>
      <div className="space-y-1">
        <Label>Notas</Label>
        <Textarea {...register('notes')} placeholder="Observaciones opcionales..." rows={2} />
      </div>
      {mutation.isError && <p className="text-sm text-red-500">Error al registrar egreso.</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Registrar Egreso'}</Button>
      </div>
    </form>
  );
}
