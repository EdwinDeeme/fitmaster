'use client';

import { useForm, Controller } from 'react-hook-form';
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
  type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'COMBINED';
  price: number;
  priceMonthly?: number;
  priceQuarterly?: number;
  priceAnnual?: number;
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
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export function MembershipPlanForm({ plan, onSuccess, onCancel }: Props) {
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: plan ? {
      name: plan.name,
      description: plan.description ?? '',
      type: plan.type,
      price: plan.type !== 'COMBINED' ? Number(plan.price) : 0,
      priceMonthly:   plan.type === 'COMBINED' ? plan.prices?.monthly   : undefined,
      priceQuarterly: plan.type === 'COMBINED' ? plan.prices?.quarterly : undefined,
      priceAnnual:    plan.type === 'COMBINED' ? plan.prices?.annual    : undefined,
    } : { type: 'MONTHLY' },
  });

  const selectedType = watch('type');
  const isCombined = selectedType === 'COMBINED';

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = isCombined
        ? {
            name: data.name,
            description: data.description,
            type: 'COMBINED' as const,
            prices: {
              monthly:   data.priceMonthly   ? Number(data.priceMonthly)   : undefined,
              quarterly: data.priceQuarterly ? Number(data.priceQuarterly) : undefined,
              annual:    data.priceAnnual    ? Number(data.priceAnnual)    : undefined,
            },
          }
        : {
            name: data.name,
            description: data.description,
            type: data.type,
            price: Number(data.price),
          };

      return plan
        ? membershipPlansService.update(plan.id, { ...payload, isActive })
        : membershipPlansService.create(payload as any);
    },
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 p-4 pb-8">
      <div className="space-y-1">
        <Label>Nombre del plan</Label>
        <Input placeholder="Ej: Plan Premium" {...register('name', { required: 'Requerido' })} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Descripción <span className="text-gray-400 text-xs">(opcional)</span></Label>
        <Input placeholder="Ej: Acceso completo al gimnasio" {...register('description')} />
      </div>

      <div className="space-y-1">
        <Label>Tipo</Label>
        <Controller
          control={control}
          name="type"
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value} onChange={e => field.onChange(e.target.value)}>
              <option value="MONTHLY">Mensual</option>
              <option value="QUARTERLY">Trimestral</option>
              <option value="ANNUAL">Anual</option>
              <option value="COMBINED">Combinado (Mensual + Trimestral + Anual)</option>
            </Select>
          )}
        />
      </div>

      {/* Single price for non-combined */}
      {!isCombined && (
        <div className="space-y-1">
          <Label>Precio (₡)</Label>
          <Input
            type="number" step="0.01" placeholder="0.00"
            {...register('price', { required: !isCombined ? 'Requerido' : false, min: 0, valueAsNumber: true })}
          />
          {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
        </div>
      )}

      {/* Three prices for combined */}
      {isCombined && (
        <div className="space-y-3 p-3 bg-bone rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Precios por período</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Mensual (₡)</Label>
              <Input type="number" step="0.01" placeholder="0.00" {...register('priceMonthly', { min: 0, valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Trimestral (₡)</Label>
              <Input type="number" step="0.01" placeholder="0.00" {...register('priceQuarterly', { min: 0, valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Anual (₡)</Label>
              <Input type="number" step="0.01" placeholder="0.00" {...register('priceAnnual', { min: 0, valueAsNumber: true })} />
            </div>
          </div>
        </div>
      )}

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
