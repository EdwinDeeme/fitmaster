'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { financesService } from '@/services/finances.service';
import { Client, Membership } from '@/types/gym';
import { Search, CreditCard, ShoppingBag } from 'lucide-react';

interface Props {
  clients: Client[];
  memberships: Membership[];
  onSuccess: () => void;
  onCancel: () => void;
}

const typeLabels: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual' };

function ClientSearch({ clients, value, onChange }: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() =>
    clients.filter(c =>
      `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 20),
    [clients, search]
  );

  const selected = clients.find(c => c.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex h-12 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <span className={selected ? 'text-dark' : 'text-gray-400'}>
          {selected ? `${selected.firstName} ${selected.lastName}` : 'Seleccionar cliente (opcional)...'}
        </span>
        <Search className="h-4 w-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-bone transition-colors"
              >
                Sin cliente (venta directa)
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">Sin resultados</li>
            ) : filtered.map(c => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => { onChange(c.id); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-bone transition-colors ${
                    value === c.id ? 'bg-primary/10 font-medium text-dark' : 'text-dark'
                  }`}
                >
                  <span className="font-medium">{c.firstName} {c.lastName}</span>
                  <span className="text-gray-400 ml-2 text-xs">{c.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function PaymentForm({ clients, memberships, onSuccess, onCancel }: Props) {
  const [incomeType, setIncomeType] = useState<'membership' | 'other'>('membership');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [method, setMethod] = useState('CASH');

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { amount: 0, description: '', notes: '', sinpeReference: '' },
  });

  const clientMemberships = useMemo(() =>
    memberships.filter(m =>
      m.clientId === selectedClientId && (m.status === 'ACTIVE' || m.status === 'EXPIRING_SOON')
    ),
    [memberships, selectedClientId]
  );

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedMembership(null);
    const clientMs = memberships.filter(m =>
      m.clientId === clientId && (m.status === 'ACTIVE' || m.status === 'EXPIRING_SOON')
    );
    if (clientMs.length > 0) {
      const m = clientMs[0];
      setSelectedMembership(m);
      setValue('amount', Number(m.price));
      if (m.payments?.[0]) {
        setMethod(m.payments[0].method);
      }
    }
  };

  const handleMembershipChange = (membershipId: string) => {
    const m = memberships.find(m => m.id === membershipId) ?? null;
    setSelectedMembership(m);
    if (m) setValue('amount', Number(m.price));
  };

  const mutation = useMutation({
    mutationFn: (data: any) => financesService.createPayment({
      clientId: selectedClientId || undefined,
      membershipId: incomeType === 'membership' ? selectedMembership?.id : undefined,
      amount: Number(data.amount),
      method,
      sinpeReference: method === 'SINPE_MOVIL' ? data.sinpeReference : undefined,
      description: incomeType === 'other' ? data.description : undefined,
      notes: data.notes,
    }),
    onSuccess,
  });

  const canSubmit = incomeType === 'membership'
    ? !!selectedClientId && !!selectedMembership
    : true; // other income: no client required

  return (
    <div className="p-6 space-y-5">
      {/* Income type toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIncomeType('membership')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
            incomeType === 'membership'
              ? 'border-primary bg-primary/10 text-dark'
              : 'border-gray-100 text-gray-500 hover:border-gray-200'
          }`}
        >
          <CreditCard size={15} /> Membresía
        </button>
        <button
          type="button"
          onClick={() => setIncomeType('other')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
            incomeType === 'other'
              ? 'border-primary bg-primary/10 text-dark'
              : 'border-gray-100 text-gray-500 hover:border-gray-200'
          }`}
        >
          <ShoppingBag size={15} /> Otro ingreso
        </button>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        {/* Client search */}
        <div className="space-y-1">
          <Label>Cliente {incomeType === 'other' && <span className="text-gray-400 text-xs">(opcional)</span>}</Label>
          <ClientSearch clients={clients} value={selectedClientId} onChange={handleClientChange} />
        </div>

        {/* Membership mode */}
        {incomeType === 'membership' && (
          <div className="space-y-1">
            <Label>Membresía</Label>
            <Select
              value={selectedMembership?.id ?? ''}
              onChange={e => handleMembershipChange(e.target.value)}
              disabled={!selectedClientId}
            >
              <option value="">Seleccionar membresía...</option>
              {clientMemberships.map(m => (
                <option key={m.id} value={m.id}>
                  {typeLabels[m.type]} — Vence: {new Date(m.endDate).toLocaleDateString('es-CR')}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Other income: description */}
        {incomeType === 'other' && (
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Input
              {...register('description', { required: incomeType === 'other' })}
              placeholder="Ej: Venta de proteína, clase de Zumba..."
            />
          </div>
        )}

        {/* Amount + method */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Monto (₡)</Label>
            {incomeType === 'membership' ? (
              <div className="h-12 px-4 flex items-center rounded-lg border border-gray-100 bg-bone text-sm font-semibold text-dark">
                {selectedMembership
                  ? `₡${Number(selectedMembership.price).toLocaleString('es-CR')}`
                  : <span className="text-gray-400">—</span>
                }
              </div>
            ) : (
              <Input
                {...register('amount', { required: true, valueAsNumber: true, min: 1 })}
                type="number"
                placeholder="0"
              />
            )}
          </div>
          <div className="space-y-1">
            <Label>Método de pago</Label>
            <Select value={method} onChange={e => setMethod(e.target.value)}>
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
          <Label>Notas <span className="text-gray-400 text-xs">(opcional)</span></Label>
          <Textarea {...register('notes')} placeholder="Observaciones..." rows={2} />
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-500">Error al registrar ingreso.</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending || !canSubmit}>
            {mutation.isPending ? 'Guardando...' : 'Registrar Ingreso'}
          </Button>
        </div>
      </form>
    </div>
  );
}
