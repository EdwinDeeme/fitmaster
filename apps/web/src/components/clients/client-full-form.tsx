'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { clientsService } from '@/services/clients.service';
import { CheckCircle2, User, CreditCard, Banknote } from 'lucide-react';
import { membershipPlansService, MembershipPlan } from '@/services/membership-plans.service';
import { PlanSelector, SelectedPlan } from '@/components/memberships/plan-selector';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = 'client' | 'membership' | 'payment';

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: 'client',     label: 'Datos del cliente', icon: <User size={15} /> },
  { key: 'membership', label: 'Membresía',          icon: <CreditCard size={15} /> },
  { key: 'payment',    label: 'Pago',               icon: <Banknote size={15} /> },
];

function maxDateOfBirth() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 15);
  return d;
}

function computeEndDate(startDate: string, type: string) {
  const d = new Date(startDate);
  if (type === 'MONTHLY')   d.setMonth(d.getMonth() + 1);
  if (type === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
  if (type === 'ANNUAL')    d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

interface ClientFields {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  weight: number;
  height: number;
  bodyFatPercentage?: number;
  goalType: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'STRENGTH' | 'ENDURANCE';
  measurements?: {
    waist?: number;
    chest?: number;
    arms?: number;
    hips?: number;
    thighs?: number;
  };
}

interface PaymentFields {
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'SINPE_MOVIL' | 'CASH';
}

export function ClientFullForm({ onSuccess, onCancel }: Props) {
  const qc = useQueryClient();
  const [step, setStep]                 = useState<Step>('client');
  const [clientData, setClientData]     = useState<ClientFields & { dateOfBirth: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [startDate, setStartDate]       = useState(new Date().toISOString().split('T')[0]);
  const [planError, setPlanError]       = useState(false);
  const [dob, setDob]                   = useState<Date | null>(null);
  const [dobError, setDobError]         = useState(false);

  const stepIndex = STEPS.findIndex(s => s.key === step);

  const { data: plans = [] } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: membershipPlansService.getAll,
  });

  const clientForm  = useForm<ClientFields>({
    defaultValues: {
      gender: 'MALE',
      goalType: 'WEIGHT_LOSS',
    },
  });
  const paymentForm = useForm<PaymentFields>({ defaultValues: { method: 'CASH' } });

  const mutation = useMutation({
    mutationFn: async (payment: PaymentFields) => {
      if (!clientData || !selectedPlan) return;
      const endDate = computeEndDate(startDate, selectedPlan.selectedType);
      try {
        const result = await api.post('/clients/with-membership', {
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          email: clientData.email,
          phone: clientData.phone,
          dateOfBirth: clientData.dateOfBirth,
          gender: clientData.gender,
          weight: Number(clientData.weight),
          height: Number(clientData.height),
          bodyFatPercentage: clientData.bodyFatPercentage || undefined,
          goalType: clientData.goalType,
          membership: {
            membershipPlanId: selectedPlan.id,
            type:      selectedPlan.selectedType,
            startDate: new Date(startDate).toISOString(),
            endDate:   new Date(endDate).toISOString(),
            price:     selectedPlan.selectedPrice,
            autoRenew: false,
          },
          payment: {
            method: payment.method,
            amount: selectedPlan.selectedPrice,
          },
        });

        // Auto-create first progress record with initial measurements
        const clientId = result.data?.client?.id;
        if (clientId) {
          const hasMeasurements = clientData.measurements &&
            Object.values(clientData.measurements).some(v => v && !isNaN(Number(v)));
          await clientsService.addProgress(clientId, {
            weight: Number(clientData.weight),
            bodyFatPercentage: clientData.bodyFatPercentage || undefined,
            measurements: hasMeasurements ? {
              waist:  clientData.measurements?.waist  ? Number(clientData.measurements.waist)  : undefined,
              chest:  clientData.measurements?.chest  ? Number(clientData.measurements.chest)  : undefined,
              arms:   clientData.measurements?.arms   ? Number(clientData.measurements.arms)   : undefined,
              hips:   clientData.measurements?.hips   ? Number(clientData.measurements.hips)   : undefined,
              thighs: clientData.measurements?.thighs ? Number(clientData.measurements.thighs) : undefined,
            } : undefined,
            notes: 'Medición inicial',
          });
        }
      } catch (error: any) {
        console.error('Error creando cliente:', error.response?.data || error.message);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['membership-plans'] });
      qc.invalidateQueries({ queryKey: ['gym-metrics'] });
      qc.invalidateQueries({ queryKey: ['recent-activity'] });
      onSuccess();
    },
  });

  const handleClientNext = (data: ClientFields) => {
    if (!dob) { 
      setDobError(true); 
      return; 
    }
    if (!data.firstName?.trim() || !data.lastName?.trim() || !data.email?.trim()) {
      return;
    }
    setDobError(false);
    setClientData({ ...data, dateOfBirth: dob.toISOString() });
    setStep('membership');
  };

  const handleMembershipNext = () => {
    if (!selectedPlan) { setPlanError(true); return; }
    setPlanError(false);
    setStep('payment');
  };

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
              <Input 
                type="email" 
                {...clientForm.register('email', { 
                  required: 'Requerido',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' }
                })} 
              />
              {clientForm.formState.errors.email && <p className="text-xs text-red-500">{clientForm.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Teléfono</Label>
              <Input {...clientForm.register('phone')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Fecha de nacimiento</Label>
              <DatePicker
                selected={dob}
                onChange={(date) => { setDob(date); setDobError(false); }}
                maxDate={maxDateOfBirth()}
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
              <select
                {...clientForm.register('gender', { required: 'Requerido' })}
                className="w-full h-12 px-4 rounded-lg border border-gray-200 text-sm text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Femenino</option>
                <option value="OTHER">Otro</option>
              </select>
              {clientForm.formState.errors.gender && <p className="text-xs text-red-500">{clientForm.formState.errors.gender.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.1"
                {...clientForm.register('weight', { required: 'Requerido', min: { value: 1, message: 'Mín. 1 kg' }, max: { value: 500, message: 'Máx. 500 kg' }, valueAsNumber: true })} />
              {clientForm.formState.errors.weight && <p className="text-xs text-red-500">{clientForm.formState.errors.weight.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Altura (cm)</Label>
              <Input type="number"
                {...clientForm.register('height', { required: 'Requerido', min: { value: 1, message: 'Mín. 1 cm' }, max: { value: 300, message: 'Máx. 300 cm' }, valueAsNumber: true })} />
              {clientForm.formState.errors.height && <p className="text-xs text-red-500">{clientForm.formState.errors.height.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>% Grasa corporal <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input type="number" step="0.1" placeholder="Ej: 20"
                {...clientForm.register('bodyFatPercentage', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <Label>Objetivo</Label>
              <select
                {...clientForm.register('goalType', { required: 'Requerido' })}
                className="w-full h-12 px-4 rounded-lg border border-gray-200 text-sm text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="WEIGHT_LOSS">Pérdida de peso</option>
                <option value="MUSCLE_GAIN">Ganancia muscular</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="STRENGTH">Fuerza</option>
                <option value="ENDURANCE">Resistencia</option>
              </select>
              {clientForm.formState.errors.goalType && <p className="text-xs text-red-500">{clientForm.formState.errors.goalType.message}</p>}
            </div>
          </div>

          {/* Initial measurements */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Medidas iniciales (cm) <span className="text-gray-400 font-normal normal-case">— opcionales</span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'waist',  label: 'Cintura' },
                { name: 'chest',  label: 'Pecho' },
                { name: 'arms',   label: 'Brazos' },
                { name: 'hips',   label: 'Caderas' },
                { name: 'thighs', label: 'Muslos' },
              ].map(({ name, label }) => (
                <div key={name} className="space-y-1">
                  <Label>{label}</Label>
                  <Input type="number" step="0.1" placeholder="—"
                    {...clientForm.register(`measurements.${name}` as any, { valueAsNumber: true })} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Siguiente</Button>
          </div>
        </form>
      )}

      {/* Step 2: Membership */}
      {step === 'membership' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Fecha de inicio</Label>
            <DatePicker
              selected={new Date(startDate)}
              onChange={(date) => date && setStartDate(date.toISOString().split('T')[0])}
              dateFormat="dd/MM/yyyy"
              className="w-full h-12 px-4 rounded-lg border border-gray-200 text-sm text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              wrapperClassName="w-full"
            />
          </div>
          <div className="space-y-1">
            <Label>Selecciona un plan</Label>
            <PlanSelector plans={plans} selected={selectedPlan} onSelect={p => { setSelectedPlan(p); setPlanError(false); }} />
            {planError && <p className="text-xs text-red-500">Debes seleccionar un plan</p>}
          </div>
          {plans.length === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
              No hay planes creados. Ve a la sección Membresías para crear uno primero.
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
            <div className="p-4 bg-dark rounded-xl flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{selectedPlan.name}</p>
                {selectedPlan.description && <p className="text-gray-300 text-xs mt-0.5">{selectedPlan.description}</p>}
              </div>
              <p className="text-2xl font-bold text-primary">₡{Number(selectedPlan.selectedPrice).toLocaleString('es-CR')}</p>
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
            <div className="h-12 px-4 flex items-center rounded-lg border border-gray-100 bg-bone text-sm font-semibold text-dark">
              ₡{selectedPlan ? Number(selectedPlan.selectedPrice).toLocaleString('es-CR') : '0'}
            </div>
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
