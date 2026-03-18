'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { clientsService } from '@/services/clients.service';
import { membershipsService } from '@/services/memberships.service';
import { membershipPlansService, MembershipPlan } from '@/services/membership-plans.service';
import { PlanSelector } from '@/components/memberships/plan-selector';
import { Client } from '@/types/gym';
import { User, CreditCard, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  client: Client;
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = 'client' | 'membership';

const membershipLabels: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual' };


const TYPE_ORDER: Record<string, number> = { MONTHLY: 1, QUARTERLY: 2, ANNUAL: 3 };

function computeEndDate(startDate: string, type: string) {
  const d = new Date(startDate);
  if (type === 'MONTHLY')   d.setMonth(d.getMonth() + 1);
  if (type === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
  if (type === 'ANNUAL')    d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

export function ClientForm({ client, onSuccess, onCancel }: Props) {
  const activeMembership = client.memberships?.find(
    m => m.status === 'ACTIVE' || m.status === 'EXPIRING_SOON',
  );

  const [step, setStep]                 = useState<Step>('client');
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [planError, setPlanError]       = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [startDate, setStartDate]       = useState(new Date().toISOString().split('T')[0]);
  const [dob, setDob]                   = useState<Date | null>(
    client.dateOfBirth ? new Date(client.dateOfBirth) : null,
  );
  const [dobError, setDobError] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: membershipPlansService.getAll,
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName:          client.firstName,
      lastName:           client.lastName,
      email:              client.email,
      phone:              client.phone ?? '',
      gender:             client.gender,
      weight:             client.weight,
      height:             client.height,
      bodyFatPercentage:  client.bodyFatPercentage ?? '',
      goalType:           client.goalType,
      status:             client.status,
    },
  });

  // Step 1: save client data
  const clientMutation = useMutation({
    mutationFn: (data: any) => {
      const clean: any = {};
      const allowed = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
        'weight', 'height', 'bodyFatPercentage', 'goalType', 'status'];
      for (const key of allowed) {
        if (data[key] === undefined || data[key] === '' || (typeof data[key] === 'number' && isNaN(data[key]))) continue;
        clean[key] = data[key];
      }
      return clientsService.update(client.id, clean);
    },
    onSuccess,
  });

  // Step 2: upgrade membership + payment
  const upgradeMutation = useMutation({
    mutationFn: async (method: string) => {
      if (!selectedPlan) return;
      const endDate = computeEndDate(startDate, selectedPlan.type);
      // Deactivate old membership
      if (activeMembership) {
        await membershipsService.updateStatus(activeMembership.id, 'CANCELLED');
      }
      // Create new membership + payment
      await api.post('/memberships', {
        clientId:  client.id,
        type:      selectedPlan.type,
        startDate: new Date(startDate).toISOString(),
        endDate:   new Date(endDate).toISOString(),
        price:     Number(selectedPlan.price),
        autoRenew: false,
      });
    },
    onSuccess,
  });

  const handleClientSubmit = (data: any) => {
    if (!dob) { setDobError(true); return; }
    setDobError(false);
    clientMutation.mutate({ ...data, dateOfBirth: dob.toISOString() });
  };

  const handlePlanSelect = (plan: MembershipPlan) => {
    setUpgradeError('');
    if (activeMembership) {
      const currentOrder = TYPE_ORDER[activeMembership.type] ?? 0;
      const newOrder     = TYPE_ORDER[plan.type] ?? 0;
      if (newOrder <= currentOrder) {
        setUpgradeError(`Solo puedes cambiar a un plan superior. Plan actual: ${membershipLabels[activeMembership.type] ?? activeMembership.type}`);
        setSelectedPlan(null);
        return;
      }
    }
    setSelectedPlan(plan);
    setPlanError(false);
  };

  const handleUpgradeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPlan) { setPlanError(true); return; }
    const method = (e.currentTarget.elements.namedItem('method') as HTMLSelectElement).value;
    upgradeMutation.mutate(method);
  };

  const STEPS = [
    { key: 'client' as Step,     label: 'Datos del cliente', icon: <User size={15} /> },
    { key: 'membership' as Step, label: 'Membresía',          icon: <CreditCard size={15} /> },
  ];
  const stepIndex = STEPS.findIndex(s => s.key === step);

  return (
    <div className="space-y-6 p-6">
      {/* Stepper */}
      <div className="flex items-center w-full">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <div className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              i < stepIndex   ? 'bg-green-100 text-green-800' :
              i === stepIndex ? 'bg-dark text-white' :
                                'bg-gray-100 text-gray-500'
            }`}>
              {i < stepIndex ? <CheckCircle2 size={15} /> : s.icon}
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px mx-1 shrink-0 ${i < stepIndex ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Client data */}
      {step === 'client' && (
        <form onSubmit={handleSubmit(handleClientSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input {...register('firstName', { required: true })} />
            </div>
            <div className="space-y-1">
              <Label>Apellido</Label>
              <Input {...register('lastName', { required: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" {...register('email', { required: true })} />
            </div>
            <div className="space-y-1">
              <Label>Teléfono</Label>
              <Input {...register('phone')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Fecha de nacimiento</Label>
              <DatePicker
                selected={dob}
                onChange={(date) => { setDob(date); setDobError(false); }}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/aaaa"
                className="w-full h-12 px-4 rounded-lg border border-gray-200 text-sm text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                wrapperClassName="w-full"
              />
              {dobError && <p className="text-xs text-red-500">Requerido</p>}
            </div>
            <div className="space-y-1">
              <Label>Género</Label>
              <Select {...register('gender', { required: true })}>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Femenino</option>
                <option value="OTHER">Otro</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.1" {...register('weight', { required: true, valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <Label>Altura (cm)</Label>
              <Input type="number" {...register('height', { required: true, valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <Label>% Grasa corporal</Label>
              <Input type="number" step="0.1" {...register('bodyFatPercentage', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Objetivo</Label>
              <Select {...register('goalType', { required: true })}>
                <option value="WEIGHT_LOSS">Pérdida de peso</option>
                <option value="MUSCLE_GAIN">Ganancia muscular</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="STRENGTH">Fuerza</option>
                <option value="ENDURANCE">Resistencia</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select {...register('status')}>
                <option value="ACTIVE">Activo</option>
                <option value="SUSPENDED">Suspendido</option>
                <option value="INACTIVE">Inactivo</option>
              </Select>
            </div>
          </div>
          {clientMutation.isError && (
            <p className="text-sm text-red-500">Error al guardar. Verifica los datos.</p>
          )}
          <div className="flex justify-between gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <div className="flex gap-2">
              <Button type="submit" variant="outline" disabled={clientMutation.isPending}>
                {clientMutation.isPending ? 'Guardando...' : 'Guardar datos'}
              </Button>
              <Button type="button" onClick={() => setStep('membership')}>
                Membresía →
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Step 2: Membership upgrade */}
      {step === 'membership' && (
        <form onSubmit={handleUpgradeSubmit} className="space-y-4">
          {activeMembership && (
            <div className="p-3 bg-bone rounded-xl text-sm space-y-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Membresía actual</p>
              <div className="flex justify-between">
                <span className="text-dark font-medium">{membershipLabels[activeMembership.type] ?? activeMembership.type}</span>
                <span className="font-bold text-dark">₡{Number(activeMembership.price).toLocaleString('es-CR')}</span>
              </div>
              <p className="text-xs text-gray-400">
                Vence: {new Date(activeMembership.endDate).toLocaleDateString('es-CR')}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label>Fecha de inicio del nuevo plan</Label>
            <DatePicker
              selected={new Date(startDate)}
              onChange={(date) => date && setStartDate(date.toISOString().split('T')[0])}
              dateFormat="dd/MM/yyyy"
              className="w-full h-12 px-4 rounded-lg border border-gray-200 text-sm text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              wrapperClassName="w-full"
            />
          </div>

          <div className="space-y-1">
            <Label>Selecciona el nuevo plan</Label>
            <PlanSelector plans={plans} selected={selectedPlan} onSelect={handlePlanSelect} />
            {upgradeError && <p className="text-xs text-red-500">{upgradeError}</p>}
            {planError && <p className="text-xs text-red-500">Debes seleccionar un plan</p>}
          </div>

          {selectedPlan && (
            <>
              <div className="space-y-1">
                <Label>Método de pago</Label>
                <Select name="method" defaultValue="CASH">
                  <option value="CASH">Efectivo</option>
                  <option value="SINPE_MOVIL">SINPE Móvil</option>
                  <option value="CREDIT_CARD">Tarjeta de crédito</option>
                  <option value="DEBIT_CARD">Tarjeta de débito</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Monto a cobrar</Label>
                <div className="h-12 px-4 flex items-center rounded-lg border border-gray-100 bg-bone text-sm font-semibold text-dark">
                  ₡{Number(selectedPlan.price).toLocaleString('es-CR')}
                </div>
              </div>
            </>
          )}

          {upgradeMutation.isError && (
            <p className="text-sm text-red-500">Error al actualizar la membresía.</p>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setStep('client')}>← Atrás</Button>
            <Button type="submit" disabled={upgradeMutation.isPending || !selectedPlan}>
              {upgradeMutation.isPending ? 'Guardando...' : 'Actualizar membresía'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
