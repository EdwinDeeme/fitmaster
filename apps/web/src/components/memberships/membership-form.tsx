'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { membershipsService } from '@/services/memberships.service';
import { Client } from '@/types/gym';

interface Props {
  clients: Client[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function MembershipForm({ clients, onSuccess, onCancel }: Props) {
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: { autoRenew: false },
  });

  const sanitize = (data: any) => {
    const allowed = ['clientId', 'type', 'startDate', 'endDate', 'price', 'autoRenew', 'promotionCode'];
    const clean: any = {};
    for (const key of allowed) {
      if (data[key] === undefined || data[key] === '' || (typeof data[key] === 'number' && isNaN(data[key]))) continue;
      clean[key] = data[key];
    }
    return clean;
  };

  const mutation = useMutation({
    mutationFn: (data: any) => membershipsService.create(sanitize(data)),
    onSuccess,
  });

  const typeRegister = register('type', { required: true });

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    typeRegister.onChange(e); // keep react-hook-form in sync
    const t = e.target.value;
    const start = new Date();
    const end = new Date(start);
    if (t === 'MONTHLY') end.setMonth(end.getMonth() + 1);
    else if (t === 'QUARTERLY') end.setMonth(end.getMonth() + 3);
    else if (t === 'ANNUAL') end.setFullYear(end.getFullYear() + 1);
    setValue('startDate', start.toISOString().split('T')[0]);
    setValue('endDate', end.toISOString().split('T')[0]);
  };

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
        <Label>Tipo de Membresía</Label>
        <Select {...typeRegister} onChange={handleTypeChange}>
          <option value="">Seleccionar tipo...</option>
          <option value="MONTHLY">Mensual</option>
          <option value="QUARTERLY">Trimestral</option>
          <option value="ANNUAL">Anual</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Fecha Inicio</Label>
          <Input {...register('startDate', { required: true })} type="date" />
        </div>
        <div className="space-y-1">
          <Label>Fecha Fin</Label>
          <Input {...register('endDate', { required: true })} type="date" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Precio (₡)</Label>
          <Input {...register('price', { required: true, valueAsNumber: true })} type="number" placeholder="25000" />
        </div>
        <div className="space-y-1">
          <Label>Código Promoción</Label>
          <Input {...register('promotionCode')} placeholder="PROMO10" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="autoRenew" {...register('autoRenew')} className="rounded" />
        <Label htmlFor="autoRenew">Renovación automática</Label>
      </div>
      {mutation.isError && (
        <p className="text-sm text-red-500">
          {(mutation.error as any)?.response?.data?.message
            ? Array.isArray((mutation.error as any).response.data.message)
              ? (mutation.error as any).response.data.message.join(', ')
              : (mutation.error as any).response.data.message
            : 'Error al crear membresía. Verifica los datos.'}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Creando...' : 'Crear Membresía'}</Button>
      </div>
    </form>
  );
}
