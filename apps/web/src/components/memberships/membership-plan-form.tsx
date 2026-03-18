'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { membershipPlansService, MembershipPlan } from '@/services/membership-plans.service';

interface Props {
  plan?: MembershipPlan | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description?: string;
  type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  price: number;
  isActive: boolean;
}

export function MembershipPlanForm({ plan, onSuccess, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: plan ? {
      name: plan.name,
      description: plan.description,
      type: plan.type,
      price: plan.price,
      isActive: plan.isActive,
    } : { type: 'MONTHLY', isActive: true },
  });

  const mutation = useMutation({
    mutationFn: ({ isActive, ...data }: FormData) => plan
      ? membershipPlansService.update(plan.id, { ...data, isActive, price: Number(data.price) })
      : membershipPlansService.create({ name: data.name, description: data.description, type: data.type, price: Number(data.price) }),
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 p-4">
      <div className="space-y-1">
        <Label>Nombre del plan</Label>
        <Input placeholder="Ej: Mensualidad básica" {...register('name', { required: 'Requerido' })} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label>Descripción <span className="text-gray-400 text-xs">(opcional)</span></Label>
        <Input placeholder="Ej: Acceso completo al gimnasio" {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select {...register('type', { required: true })}>
            <option value="MONTHLY">Mensual</option>
            <option value="QUARTERLY">Trimestral</option>
            <option value="ANNUAL">Anual</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Precio (₡)</Label>
          <Input type="number" step="0.01" placeholder="0.00" {...register('price', { required: 'Requerido', min: 0, valueAsNumber: true })} />
          {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
        </div>
      </div>
      {plan && (
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" {...register('isActive')} />
          <Label htmlFor="isActive">Plan activo</Label>
        </div>
      )}
      {mutation.isError && (
        <p className="text-sm text-red-500">
          {(mutation.error as any)?.response?.data?.message || 'Error al guardar el plan'}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : plan ? 'Guardar cambios' : 'Crear plan'}
        </Button>
      </div>
    </form>
  );
}
