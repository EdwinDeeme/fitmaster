'use client';

import { useQuery } from '@tanstack/react-query';
import { clientsService } from '@/services/clients.service';
import { Badge } from '@/components/ui/badge';
import { User, CreditCard, Dumbbell, Scale } from 'lucide-react';

const goalLabels: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso', MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento', STRENGTH: 'Fuerza', ENDURANCE: 'Resistencia',
};
const membershipLabels: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual' };
const methodLabels: Record<string, string> = { CREDIT_CARD: 'Tarjeta Crédito', DEBIT_CARD: 'Tarjeta Débito', SINPE_MOVIL: 'SINPE Móvil', CASH: 'Efectivo' };

export function ClientDetail({ clientId }: { clientId: string }) {
  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsService.getOne(clientId),
  });

  if (isLoading) return <div className="p-6 text-center text-gray-400">Cargando...</div>;
  if (!client) return null;

  const activeMembership = client.memberships?.find(m => m.status === 'ACTIVE' || m.status === 'EXPIRING_SOON');

  return (
    <div className="p-6 space-y-6">
      {/* Personal Info */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-xl font-bold text-dark">
          {client.firstName[0]}{client.lastName[0]}
        </div>
        <div>
          <h3 className="text-xl font-bold text-dark">{client.firstName} {client.lastName}</h3>
          <p className="text-gray-500">{client.email}</p>
          {client.phone && <p className="text-gray-500">{client.phone}</p>}
          <div className="flex gap-2 mt-2">
            <Badge variant={client.status === 'ACTIVE' ? 'success' : 'warning'}>
              {client.status === 'ACTIVE' ? 'Activo' : client.status}
            </Badge>
            <Badge variant="info">{goalLabels[client.goalType]}</Badge>
          </div>
        </div>
      </div>

      {/* Physical Stats */}
      <div>
        <div className="flex items-center gap-2 mb-3"><Scale className="h-4 w-4 text-primary" /><span className="font-semibold text-dark">Datos Físicos</span></div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Peso', value: `${client.weight} kg` },
            { label: 'Altura', value: `${client.height} cm` },
            { label: 'IMC', value: client.bmi.toFixed(1) },
            { label: '% Grasa', value: client.bodyFatPercentage ? `${client.bodyFatPercentage}%` : '—' },
            { label: 'Peso Objetivo', value: client.targetWeight ? `${client.targetWeight} kg` : '—' },
            { label: 'Fecha Objetivo', value: client.targetDate ? new Date(client.targetDate).toLocaleDateString('es-CR') : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-bone rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-bold text-dark">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Membership */}
      <div>
        <div className="flex items-center gap-2 mb-3"><CreditCard className="h-4 w-4 text-primary" /><span className="font-semibold text-dark">Membresía Activa</span></div>
        {activeMembership ? (
          <div className="bg-bone rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Tipo</span>
              <span className="font-medium">{membershipLabels[activeMembership.type]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Inicio</span>
              <span className="font-medium">{new Date(activeMembership.startDate).toLocaleDateString('es-CR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Vence</span>
              <span className="font-medium">{new Date(activeMembership.endDate).toLocaleDateString('es-CR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Precio</span>
              <span className="font-bold text-dark">₡{Number(activeMembership.price).toLocaleString('es-CR')}</span>
            </div>
            {activeMembership.payments?.[0] && (
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-sm text-gray-500">Último pago</span>
                <span className="text-sm">{new Date(activeMembership.payments[0].createdAt).toLocaleDateString('es-CR')} — {methodLabels[activeMembership.payments[0].method]}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 bg-bone rounded-xl p-4">Sin membresía activa</p>
        )}
      </div>

      {/* Routines */}
      {client.routineAssignments && client.routineAssignments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3"><Dumbbell className="h-4 w-4 text-primary" /><span className="font-semibold text-dark">Rutina Asignada</span></div>
          {client.routineAssignments.map(a => (
            <div key={a.id} className="bg-bone rounded-xl p-4">
              <p className="font-medium text-dark">{a.routine?.name}</p>
              <p className="text-sm text-gray-500">Dificultad: {a.routine?.difficulty} · Desde: {new Date(a.startDate).toLocaleDateString('es-CR')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
