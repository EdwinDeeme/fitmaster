'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { membershipsService } from '@/services/memberships.service';
import { membershipPlansService, MembershipPlan } from '@/services/membership-plans.service';
import { PlanSelector } from './plan-selector';
import { Client } from '@/types/gym';

interface Props {
  clients: Client[];
  onSuccess: () => void;
  onCancel: () => void;
}

function computeEndDate(startDate: string, type: string) {
  const d = new Date(startDate);
  if (type === 'MONTHLY')   d.setMonth(d.getMonth() + 1);
  if (type === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
  if (type === 'ANNUAL')    d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

export function MembershipForm({ clients, onSuccess, onCancel }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [planError, setPlanError]       = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: membershipPlansService.getAll,
  });

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      clientId:  '',
      startDate: new Date().toISOString().split('T')[0],
      promotionCode: '',
      autoRenew: false,
    },
  });

  const startDate = watch('startDate');

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (!selectedPlan) { setPlanError(true); throw new Error('Plan requerido'); }
      return membershipsService.create({
        clientId:      data.clientId,
        type:          selectedPlan.type,
        startDate:     new Date(data.startDate).toISOString(),
        endDate:       new Date(computeEndDate(data.startDate, selectedPlan.type)).toISOString(),
        price:         Number(selectedPlan.price),
        autoRenew:     data.autoRenew,
        promotionCode: data.promotionCode || undefined,
      });
    },
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
      <div className="space-y-1">
        <Label>Cliente</Label>
        <Select {...register('clientId', { required: true })}>
          <option value="">Seleccionar cliente...</option>
          {clients.filter(c => c.status === 'ACTIVE').map(c => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.email}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Fecha de inicio</Label>
        <Input type="date" {...register('startDate', { required: true })} />
      </div>

      <div className="space-y-1">
        <Label>Plan de membresía</Label>
        <PlanSelector plans={plans} selected={selectedPlan} onSelect={p => { setSelectedPlan(p); setPlanError(false); }} />
        {planError && <p className="text-xs text-red-500">Debes seleccionar un plan</p>}
      </div>

      {selectedPlan && startDate && (
        <p className="text-xs text-gray-500">
          Vence el: {new Date(computeEndDate(startDate, selectedPlan.type)).toLocaleDateString('es-CR')}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Código de promoción <span className="text-gray-400">(opcional)</span></Label>
          <Input {...register('promotionCode')} placeholder="PROMO10" />
        </div>
        <div className="flex items-end pb-1">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="autoRenew" {...register('autoRenew')} />
            <Label htmlFor="autoRenew">Renovación automática</Label>
          </div>
        </div>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-500">
          {(mutation.error as any)?.response?.data?.message || 'Error al crear membresía'}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creando...' : 'Crear Membresía'}
        </Button>
      </div>
    </form>
  );
}
