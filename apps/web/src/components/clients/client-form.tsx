'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { clientsService } from '@/services/clients.service';
import { Client } from '@/types/gym';

interface Props {
  client?: Client;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSuccess, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: client ? {
      ...client,
      dateOfBirth: client.dateOfBirth?.split('T')[0],
      targetDate: client.targetDate?.split('T')[0],
    } : {},
  });

  const sanitize = (data: any) => {
    // Strip fields not in the DTO and clean up NaN values from empty number inputs
    const allowed = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
      'weight', 'height', 'bodyFatPercentage', 'goalType', 'targetWeight', 'targetDate', 'status'];
    const clean: any = {};
    for (const key of allowed) {
      if (data[key] === undefined || data[key] === '' || (typeof data[key] === 'number' && isNaN(data[key]))) continue;
      clean[key] = data[key];
    }
    return clean;
  };

  const mutation = useMutation({
    mutationFn: (data: any) => client ? clientsService.update(client.id, sanitize(data)) : clientsService.create(sanitize(data)),
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Nombre</Label>
          <Input {...register('firstName', { required: true })} placeholder="Juan" />
        </div>
        <div className="space-y-1">
          <Label>Apellido</Label>
          <Input {...register('lastName', { required: true })} placeholder="Pérez" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Email</Label>
          <Input {...register('email', { required: true })} type="email" placeholder="juan@email.com" />
        </div>
        <div className="space-y-1">
          <Label>Teléfono</Label>
          <Input {...register('phone')} placeholder="8888-8888" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Fecha de Nacimiento</Label>
          <Input {...register('dateOfBirth', { required: true })} type="date" />
        </div>
        <div className="space-y-1">
          <Label>Género</Label>
          <Select {...register('gender', { required: true })}>
            <option value="">Seleccionar...</option>
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Femenino</option>
            <option value="OTHER">Otro</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Peso (kg)</Label>
          <Input {...register('weight', { required: true, valueAsNumber: true })} type="number" step="0.1" placeholder="70" />
        </div>
        <div className="space-y-1">
          <Label>Altura (cm)</Label>
          <Input {...register('height', { required: true, valueAsNumber: true })} type="number" placeholder="170" />
        </div>
        <div className="space-y-1">
          <Label>% Grasa Corporal</Label>
          <Input {...register('bodyFatPercentage', { valueAsNumber: true })} type="number" step="0.1" placeholder="20" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Objetivo</Label>
          <Select {...register('goalType', { required: true })}>
            <option value="">Seleccionar...</option>
            <option value="WEIGHT_LOSS">Pérdida de peso</option>
            <option value="MUSCLE_GAIN">Ganancia muscular</option>
            <option value="MAINTENANCE">Mantenimiento</option>
            <option value="STRENGTH">Fuerza</option>
            <option value="ENDURANCE">Resistencia</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Peso Objetivo (kg)</Label>
          <Input {...register('targetWeight', { valueAsNumber: true })} type="number" step="0.1" placeholder="65" />
        </div>
      </div>
      {client && (
        <div className="space-y-1">
          <Label>Estado</Label>
          <Select {...register('status')}>
            <option value="ACTIVE">Activo</option>
            <option value="SUSPENDED">Suspendido</option>
            <option value="INACTIVE">Inactivo</option>
          </Select>
        </div>
      )}
      {mutation.isError && (
        <p className="text-sm text-red-500">
          {(mutation.error as any)?.response?.data?.message
            ? Array.isArray((mutation.error as any).response.data.message)
              ? (mutation.error as any).response.data.message.join(', ')
              : (mutation.error as any).response.data.message
            : 'Error al guardar. Verifica los datos.'}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : client ? 'Actualizar' : 'Crear Cliente'}</Button>
      </div>
    </form>
  );
}
