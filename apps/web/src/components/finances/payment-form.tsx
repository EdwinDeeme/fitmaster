'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { financesService } from '@/services/finances.service';
import { Client, Membership } from '@/types/gym';
import { useState } from 'react';

interface Props {
  clients: Client[];
  memberships: Membership[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({ clients, memberships, onSuccess, onCancel }: Props) {
  const { register, handleSubmit, watch } = useForm();
  const [selectedClient, setSelectedClient] = useState('');
  const method = watch('method');

  const clientMemberships = memberships.filter(m => m.clientId === selectedClient && (m.status === 'ACTIVE' || m.status === 'EXPIRING_SOON'));

  const mutation = useMutation({
    mutationFn: financesService.createPayment,
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate({ ...d, clientId: selectedClient }))} className="p-6 space-y-4">
      <div className="space-y-1">
        <Label>Cliente</Label>
        <Select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} required>
          <option value="">Seleccionar cliente...</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Membresía</Label>
        <Select {...register('membershipId', { required: true })} disabled={!selectedClient}>
          <option value="">Seleccionar membresía...</option>
          {clientMemberships.map(m => (
            <option key={m.id} value={m.id}>
              {m.type === 'MONTHLY' ? 'Mensual' : m.type === 'QUARTERLY' ? 'Trimestral' : 'Anual'} — Vence: {new Date(m.endDate).toLocaleDateString('es-CR')}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Monto (₡)</Label>
          <Input {...register('amount', { required: true, valueAsNumber: true })} type="number" placeholder="25000" />
        </div>
        <div className="space-y-1">
          <Label>Método de Pago</Label>
          <Select {...register('method', { required: true })}>
            <option value="">Seleccionar...</option>
            <option value="CASH">Efectivo</option>
            <option value="SINPE_MOVIL">SINPE Móvil</option>
            <option value="CREDIT_CARD">Tarjeta Crédito</option>
            <option value="DEBIT_CARD">Tarjeta Débito</option>
          </Select>
        </div>
      </div>
      {method === 'SINPE_MOVIL' && (
        <div className="space-y-1">
          <Label>Referencia SINPE</Label>
          <Input {...register('sinpeReference')} placeholder="Número de confirmación" />
        </div>
      )}
      <div className="space-y-1">
        <Label>Notas</Label>
        <Textarea {...register('notes')} placeholder="Observaciones opcionales..." rows={2} />
      </div>
      {mutation.isError && <p className="text-sm text-red-500">Error al registrar pago.</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Registrar Pago'}</Button>
      </div>
    </form>
  );
}
