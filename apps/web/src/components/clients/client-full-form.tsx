'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { CheckCircle2, User, CreditCard, Banknote } from 'lucide-react';
import { membershipPlansService, MembershipPlan } from '@/services/membership-plans.service';
import { PlanSelector } from '@/components/memberships/plan-selector';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = 'client' | 'membership' | 'payment';

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: 'client',     label: 'Datos del cliente', icon: <User size={14} /> },
  { key: 'membership', label: 'Membresía',          icon: <CreditCard size={14} /> },
  { key: 'payment',    label: 'Pago',               icon: <Banknote size={14} /> },
];

function maxDateOfBirth() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 15);
  return d.toISOString().split('T')[0];
}

function computeEndDate(startDate: string, type: string) {
  const d = new Date(startDate);
  if (type === 'MONTHLY')   d.setMonth(d.getMonth() + 1);
  if (type === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
  if (type === 'ANNUAL')    d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

interface ClientFields {
  firstName: string; lastName: string; email: string; phone?: string;
  dateOfBirth: string; gender: 'MALE' | 'FEMALE' | 'OTHER';
  weight: number; height: number;
  goalType: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'STRENGTH' | 'ENDURANCE';
}

interface PaymentFields {
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'SINPE_MOVIL' | 'CASH';
  amount: number;
}

export function ClientFullForm({ onSuccess, onCancel }: Props) {
  const [step, setStep]               = useState<Step>('client');
  const [clientData, setClientData]   = useState<ClientFields | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [startDate, setStartDate]     = useState(new Date().toISOString().split('T')[0]);
  const [planError, setPlanError]     = useState(false);

  const stepIndex = STEPS.findIndex(s => s.key === step);

  const { data: plans = [] } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: membershipPlansService.getAll,
  });

  const clientForm  = useForm<ClientFields>();
  const paymentForm = useForm<PaymentFields>({ defaultValues: { method: 'CASH' } });

  const mutation = useMutation({
    mutationFn: async (payment: PaymentFields) => {
      if (!clientData || !selectedPlan) return;
      const endDate = computeEndDate(startDate, selectedPlan.type);
      await api.post('/clients/with-membership', {
        ...clientData,
        weight: Number(clientData.weight),
        height: Number(clientData.height),
        membership: {
          type:      selectedPlan.type,
          startDate: new Date(startDate).toISOString(),
          endDate:   new Date(endDate).toISOString(),
          price:     Number(selectedPlan.price),
          autoRenew: false,
        },
        payment: {
          method: payment.method,
          amount: Number(payment.amount),
        },
      });
    },
    onSuccess,
  });

  const handleClientNext = (data: ClientFields) => {
    setClientData(data);
    setStep('membership');
  };

  const handleMembershipNext = () => {
    if (!selectedPlan) { setPlanError(true); return; }
    setPlanError(false);
    paymentForm.setValue('amount', Number(selectedPlan.price));
    setStep('payment');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              i < stepIndex   ? 'bg-green-100 text-green-700' :
              i === stepIndex ? 'bg-primary text-white' :
                                'bg-gray-100 text-gray-400'
            }`}>
              {i < stepIndex ? <CheckCircle2 size={13} /> : s.icon}
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 ${i < stepIndex ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Client */}
      {step === 'client' && (
        <form onSubmit={clientForm.handleSubmit(handleClientNext)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input {...clientForm.register('firstName', { required: 'Requerido' })} />
              {clientForm.formState.errors.firstName && <p className="text-xs text-red-500">{clientForm.formState.errors.firstName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Apellido</Label>
              <Input {...clientForm.register('lastName', { required: 'Requerido' })} />
              {clientForm.formState.errors.lastName && <p className="text-xs text-red-500">{clientForm.formState.errors.lastName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" {...clientForm.register('email', { required: 'Requerido' })} />
            </div>
            <div className="space-y-1">
              <Label>Teléfono</Label>
              <Input {...clientForm.register('phone')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Fecha de nacimiento</Label>
              <Input type="date" max={maxDateOfBirth()}
                {...clientForm.register('dateOfBirth', {
                  required: 'Requerido',
                  validate: v => new Date(v) <= new Date(maxDateOfBirth()) || 'Edad mínima 15 años',
                })}
              />
              {clientForm.formState.errors.dateOfBirth && <p className="text-xs text-red-500">{clientForm.formState.errors.dateOfBirth.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Género</Label>
              <Select {...clientForm.register('gender', { required: true })}>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Femenino</option>
                <option value="OTHER">Otro</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.1" {...clientForm.register('weight', { required: true, min: 1 })} />
            </div>
            <div className="space-y-1">
              <Label>Altura (cm)</Label>
              <Input type="number" {...clientForm.register('height', { required: true, min: 1 })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Objetivo</Label>
            <Select {...clientForm.register('goalType', { required: true })}>
              <option value="WEIGHT_LOSS">Pérdida de peso</option>
              <option value="MUSCLE_GAIN">Ganancia muscular</option>
              <option value="MAINTENANCE">Mantenimiento</option>
              <option value="STRENGTH">Fuerza</option>
              <option value="ENDURANCE">Resistencia</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Siguiente</Button>
          </div>
        </form>
      )}

      {/* Step 2: Membership plan */}
      {step === 'membership' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Fecha de inicio</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Selecciona un plan</Label>
            <PlanSelector plans={plans} selected={selectedPlan} onSelect={p => { setSelectedPlan(p); setPlanError(false); }} />
            {planError && <p className="text-xs text-red-500">Debes seleccionar un plan</p>}
          </div>
          {plans.length === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
              No hay planes creados. Ve a la sección Membresías → Planes para crear uno primero.
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setStep('client')}>Atrás</Button>
            <Button type="button" onClick={handleMembershipNext}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 'payment' && (
        <form onSubmit={paymentForm.handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          {selectedPlan && (
            <div className="p-3 bg-bone rounded-xl text-sm">
              <p className="font-medium text-dark">{selectedPlan.name}</p>
              <p className="text-gray-500 text-xs">{selectedPlan.description}</p>
            </div>
          )}
          <div className="space-y-1">
            <Label>Método de pago</Label>
            <Select {...paymentForm.register('method', { required: true })}>
              <option value="CASH">Efectivo</option>
              <option value="SINPE_MOVIL">SINPE Móvil</option>
              <option value="CREDIT_CARD">Tarjeta de crédito</option>
              <option value="DEBIT_CARD">Tarjeta de débito</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Monto a cobrar</Label>
            <Input type="number" step="0.01" {...paymentForm.register('amount', { required: true, min: 0, valueAsNumber: true })} />
          </div>
          {mutation.isError && (
            <p className="text-sm text-red-500">
              {(mutation.error as any)?.response?.data?.message || 'Error al crear el cliente'}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setStep('membership')}>Atrás</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Crear cliente'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
