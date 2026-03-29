'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
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

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function MembershipPlanForm({ plan, onSuccess, onCancel }: Props) {
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: plan ? {
      name: plan.name,
      description: plan.description,
      type: plan.type,
      price: plan.price,
    } : { type: 'MONTHLY' },
  });

  const mutation = useMutation({
    mutationFn: (data: Omit<FormData, 'isActive'>) => plan
      ? membershipPlansService.update(plan.id, { ...data, isActive, price: Number(data.price) })
      : membershipPlansService.create({ name: data.name, description: data.description, type: data.type, price: Number(data.price) }),
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 p-4 pb-8">
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
        <div className="flex items-center justify-between p-3 bg-bone rounded-xl">
          <div>
            <p className="text-sm font-medium text-dark">Plan activo</p>
            <p className="text-xs text-gray-400">Los clientes pueden suscribirse a este plan</p>
          </div>
          <Switch checked={isActive} onChange={setIsActive} />
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
