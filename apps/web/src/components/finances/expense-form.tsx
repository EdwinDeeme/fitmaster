'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { financesService } from '@/services/finances.service';

interface Props { onSuccess: () => void; onCancel: () => void; }

export function ExpenseForm({ onSuccess, onCancel }: Props) {
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState('');

  const { register, handleSubmit } = useForm({
    defaultValues: { currency: 'CRC' },
  });

  const mutation = useMutation({
    mutationFn: financesService.createExpense,
    onSuccess,
  });

  const onSubmit = (data: any) => {
    mutation.mutate({
      ...data,
      category,
      date: date.toISOString().split('T')[0],
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
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
          <Select value={category} onChange={e => setCategory(e.target.value)}>
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
        <DatePicker
          selected={date}
          onChange={(d) => d && setDate(d)}
          dateFormat="dd/MM/yyyy"
          locale="es"
          maxDate={new Date()}
          className="flex h-12 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary"
          wrapperClassName="w-full"
        />
      </div>
      <div className="space-y-1">
        <Label>Notas <span className="text-gray-400 text-xs">(opcional)</span></Label>
        <Textarea {...register('notes')} placeholder="Observaciones opcionales..." rows={2} />
      </div>
      {mutation.isError && <p className="text-sm text-red-500">Error al registrar egreso.</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending || !category}>
          {mutation.isPending ? 'Guardando...' : 'Registrar Egreso'}
        </Button>
      </div>
    </form>
  );
}
