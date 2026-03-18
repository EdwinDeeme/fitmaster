'use client';

import { useQuery } from '@tanstack/react-query';
import { clientsService } from '@/services/clients.service';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Dumbbell } from 'lucide-react';

const goalLabels: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso', MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento', STRENGTH: 'Fuerza', ENDURANCE: 'Resistencia',
};
const membershipLabels: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual' };
const methodLabels: Record<string, string> = {
  CREDIT_CARD: 'Tarjeta Crédito', DEBIT_CARD: 'Tarjeta Débito',
  SINPE_MOVIL: 'SINPE Móvil', CASH: 'Efectivo',
};
const genderLabels: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Femenino', OTHER: 'Otro' };

export function ClientDetail({ clientId }: { clientId: string }) {
  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsService.getOne(clientId),
  });

  if (isLoading) return <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>;
  if (!client) return null;

  const activeMembership = client.memberships?.find(
    m => m.status === 'ACTIVE' || m.status === 'EXPIRING_SOON',
  );

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="bg-dark rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-lg font-bold text-dark shrink-0">
          {client.firstName[0]}{client.lastName[0]}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white truncate">
            {client.firstName} {client.lastName}
          </h3>
          <p className="text-gray-400 text-sm truncate">{client.email}</p>
          {client.phone && <p className="text-gray-400 text-sm">{client.phone}</p>}
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant={client.status === 'ACTIVE' ? 'success' : 'warning'}>
              {client.status === 'ACTIVE' ? 'Activo' : client.status}
            </Badge>
            <Badge variant="info">{goalLabels[client.goalType]}</Badge>
          </div>
        </div>
      </div>

      {/* Physical stats */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Datos físicos</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Peso',    value: `${client.weight} kg` },
            { label: 'Altura',  value: `${client.height} cm` },
            { label: 'IMC',     value: client.bmi.toFixed(1) },
            { label: 'Género',  value: genderLabels[client.gender] },
            { label: '% Grasa', value: client.bodyFatPercentage ? `${client.bodyFatPercentage}%` : '—' },
            { label: 'Nacimiento', value: new Date(client.dateOfBirth).toLocaleDateString('es-CR') },
          ].map(({ label, value }) => (
            <div key={label} className="bg-bone rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-semibold text-dark text-sm mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Membership */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Membresía activa</p>
        </div>
        {activeMembership ? (
          <div className="bg-bone rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-dark">{membershipLabels[activeMembership.type]}</span>
              <span className="font-bold text-dark">₡{Number(activeMembership.price).toLocaleString('es-CR')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{new Date(activeMembership.startDate).toLocaleDateString('es-CR')}</span>
              <span>→</span>
              <span>{new Date(activeMembership.endDate).toLocaleDateString('es-CR')}</span>
            </div>
            {activeMembership.payments?.[0] && (
              <p className="text-xs text-gray-400 border-t border-gray-200 pt-2">
                Último pago: {new Date(activeMembership.payments[0].createdAt).toLocaleDateString('es-CR')} · {methodLabels[activeMembership.payments[0].method]}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 bg-bone rounded-xl p-4">Sin membresía activa</p>
        )}
      </div>

      {/* Routine */}
      {client.routineAssignments && client.routineAssignments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rutina asignada</p>
          </div>
          {client.routineAssignments.map(a => (
            <div key={a.id} className="bg-bone rounded-xl p-3">
              <p className="font-medium text-dark text-sm">{a.routine?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {a.routine?.difficulty} · Desde {new Date(a.startDate).toLocaleDateString('es-CR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
