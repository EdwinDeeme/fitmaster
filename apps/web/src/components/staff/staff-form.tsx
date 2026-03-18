'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { staffService } from '@/services/staff.service';
import { StaffMember } from '@/types/gym';

interface Props { staff?: StaffMember; onSuccess: () => void; onCancel: () => void; }

export function StaffForm({ staff, onSuccess, onCancel }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: staff ?? {} });

  const mutation = useMutation({
    mutationFn: (data: any) => staff ? staffService.update(staff.id, data) : staffService.create(data),
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
      <div className="space-y-1">
        <Label>Email</Label>
        <Input {...register('email', { required: true })} type="email" placeholder="juan@gimnasio.com" disabled={!!staff} />
      </div>
      {!staff && (
        <div className="space-y-1">
          <Label>Contraseña</Label>
          <Input {...register('password', { required: !staff, minLength: 8 })} type="password" placeholder="Mínimo 8 caracteres" />
        </div>
      )}
      <div className="space-y-1">
        <Label>Rol</Label>
        <Select {...register('role', { required: true })} disabled={!!staff}>
          <option value="">Seleccionar rol...</option>
          <option value="TRAINER">Entrenador</option>
          <option value="RECEPTIONIST">Recepcionista</option>
        </Select>
      </div>
      {mutation.isError && <p className="text-sm text-red-500">Error al guardar. Verifica los datos.</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : staff ? 'Actualizar' : 'Crear Miembro'}</Button>
      </div>
    </form>
  );
}
