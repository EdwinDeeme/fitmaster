'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { staffService } from '@/services/staff.service';
import { StaffMember } from '@/types/gym';

interface Props { staff: StaffMember; onSuccess: () => void; onCancel: () => void; }

export function ResetPasswordForm({ staff, onSuccess, onCancel }: Props) {
  const { register, handleSubmit, watch } = useForm();
  const password = watch('newPassword');

  const mutation = useMutation({
    mutationFn: (data: any) => staffService.resetPassword(staff.id, data.newPassword),
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
      <div className="bg-bone rounded-xl p-3">
        <p className="text-xs text-gray-500">Usuario</p>
        <p className="font-semibold text-dark">{staff.firstName} {staff.lastName}</p>
        <p className="text-sm text-gray-500">{staff.email}</p>
      </div>
      <div className="space-y-1">
        <Label>Nueva Contraseña</Label>
        <Input {...register('newPassword', { required: true, minLength: 8 })} type="password" placeholder="Mínimo 8 caracteres" />
      </div>
      <div className="space-y-1">
        <Label>Confirmar Contraseña</Label>
        <Input {...register('confirm', { required: true, validate: v => v === password || 'Las contraseñas no coinciden' })} type="password" placeholder="Repetir contraseña" />
      </div>
      {mutation.isError && <p className="text-sm text-red-500">Error al actualizar contraseña.</p>}
      {mutation.isSuccess && <p className="text-sm text-green-600">Contraseña actualizada correctamente.</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Actualizando...' : 'Actualizar Contraseña'}</Button>
      </div>
    </form>
  );
}
