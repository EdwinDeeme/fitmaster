'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientsService } from '@/services/clients.service';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Scale, TrendingDown, TrendingUp, Minus, Dumbbell,
  CreditCard, Activity, Target, Calendar, ChevronDown, ChevronUp, Ruler,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const goalLabels: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso', MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento', STRENGTH: 'Fuerza', ENDURANCE: 'Resistencia',
};
const difficultyLabels: Record<string, string> = {
  BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado',
};
const membershipLabels: Record<string, string> = {
  MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual',
};
const membershipStatusMap: Record<string, any> = {
  ACTIVE: 'success', EXPIRING_SOON: 'warning', EXPIRED: 'danger', CANCELLED: 'secondary',
};
const membershipStatusLabels: Record<string, string> = {
  ACTIVE: 'Activa', EXPIRING_SOON: 'Por vencer', EXPIRED: 'Vencida', CANCELLED: 'Cancelada',
};

function fmt(dateStr: string) {
  try { return format(parseISO(dateStr), 'dd MMM yy', { locale: es }); }
  catch { return dateStr; }
}

function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark text-white text-xs rounded-xl px-3 py-2 shadow-lg">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}{unit}
        </p>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, trend }: {
  icon: any; label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral';
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
      <div className="p-2 bg-primary/10 rounded-xl shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-lg font-bold text-dark leading-tight">{value}</p>
        {sub && (
          <div className={`flex items-center gap-1 mt-0.5 ${trendColor}`}>
            {trend && <TrendIcon className="h-3 w-3" />}
            <span className="text-xs">{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-bone/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-semibold text-dark text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export function ClientTrackingModal({ clientId }: { clientId: string }) {
  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsService.getOne(clientId),
  });

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center gap-3 text-gray-400">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Cargando seguimiento...</span>
      </div>
    );
  }
  if (!client) return null;

  const progress = [...(client.physicalProgress ?? [])].reverse();
  const weightData = progress.map(p => ({ date: fmt(p.date), peso: p.weight, grasa: p.bodyFatPercentage ?? null }));

  const firstWeight = progress[0]?.weight;
  const lastWeight = progress[progress.length - 1]?.weight;
  const weightDelta = firstWeight && lastWeight ? +(lastWeight - firstWeight).toFixed(1) : null;
  const weightTrend = weightDelta === null ? undefined : weightDelta < 0 ? 'down' : weightDelta > 0 ? 'up' : 'neutral';

  const firstFat = progress[0]?.bodyFatPercentage;
  const lastFat = progress[progress.length - 1]?.bodyFatPercentage;
  const fatDelta = firstFat && lastFat ? +(lastFat - firstFat).toFixed(1) : null;

  const memberships = client.memberships ?? [];
  const totalPaid = memberships.reduce((acc, m) => acc + (m.payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0), 0);

  const routines = client.routineAssignments ?? [];
  const activeRoutine = routines.find(r => r.isActive);
  const latestMeasurements = progress[progress.length - 1]?.measurements;

  return (
    <div className="p-4 sm:p-6 space-y-4 bg-bone">

      {/* Client header */}
      <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-lg font-bold text-dark shrink-0">
          {client.firstName[0]}{client.lastName[0]}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-dark truncate">{client.firstName} {client.lastName}</h3>
          <p className="text-xs text-gray-500 truncate">{client.email}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <Badge variant={client.status === 'ACTIVE' ? 'success' : 'warning'}>
              {client.status === 'ACTIVE' ? 'Activo' : client.status}
            </Badge>
            <Badge variant="info">{goalLabels[client.goalType]}</Badge>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Scale}
          label="Peso actual"
          value={lastWeight ? `${lastWeight} kg` : `${client.weight} kg`}
          sub={weightDelta !== null ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg total` : 'Sin historial'}
          trend={weightTrend}
        />
        <StatCard
          icon={Activity}
          label="% Grasa"
          value={lastFat ? `${lastFat}%` : client.bodyFatPercentage ? `${client.bodyFatPercentage}%` : '—'}
          sub={fatDelta !== null ? `${fatDelta > 0 ? '+' : ''}${fatDelta}% total` : undefined}
          trend={fatDelta === null ? undefined : fatDelta < 0 ? 'down' : 'up'}
        />
        <StatCard
          icon={Target}
          label="Peso objetivo"
          value={client.targetWeight ? `${client.targetWeight} kg` : '—'}
          sub={client.targetWeight && lastWeight
            ? `Faltan ${Math.abs(+(lastWeight - client.targetWeight).toFixed(1))} kg`
            : undefined}
        />
        <StatCard
          icon={Dumbbell}
          label="Rutinas"
          value={String(routines.length)}
          sub={activeRoutine ? activeRoutine.routine?.name : 'Sin rutina activa'}
        />
      </div>

      {/* Weight chart */}
      {weightData.length > 1 && (
        <Section title="Evolución de Peso" icon={Scale}>
          <div className="h-52 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C1EF00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C1EF00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip unit=" kg" />} />
                {client.targetWeight && (
                  <ReferenceLine y={client.targetWeight} stroke="#C1EF00" strokeDasharray="4 4"
                    label={{ value: `Objetivo ${client.targetWeight}kg`, position: 'insideTopRight', fontSize: 10, fill: '#8FB800' }} />
                )}
                <Area type="monotone" dataKey="peso" name="Peso" stroke="#C1EF00" strokeWidth={2.5}
                  fill="url(#weightGrad)" dot={{ fill: '#C1EF00', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Body fat chart */}
      {weightData.some(d => d.grasa !== null) && (
        <Section title="Evolución % Grasa Corporal" icon={Activity}>
          <div className="h-44 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData.filter(d => d.grasa !== null)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} unit="%" />
                <Tooltip content={<CustomTooltip unit="%" />} />
                <Area type="monotone" dataKey="grasa" name="% Grasa" stroke="#60A5FA" strokeWidth={2.5}
                  fill="url(#fatGrad)" dot={{ fill: '#60A5FA', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Latest measurements */}
      {latestMeasurements && Object.values(latestMeasurements).some(v => v) && (
        <Section title="Últimas Medidas" icon={Ruler}>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
            {[
              { key: 'chest', label: 'Pecho' },
              { key: 'waist', label: 'Cintura' },
              { key: 'hips', label: 'Caderas' },
              { key: 'arms', label: 'Brazos' },
              { key: 'thighs', label: 'Muslos' },
            ].map(({ key, label }) => {
              const val = (latestMeasurements as any)[key];
              if (!val) return null;
              return (
                <div key={key} className="bg-bone rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-bold text-dark text-sm">{val} cm</p>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Progress history */}
      {progress.length > 0 && (
        <Section title={`Historial de Mediciones (${progress.length})`} icon={Calendar} defaultOpen={false}>
          <div className="overflow-x-auto mt-2 rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-bone">
                <tr>
                  {['Fecha', 'Peso', '% Grasa', 'Cintura', 'Notas'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...progress].reverse().map(p => (
                  <tr key={p.id} className="hover:bg-bone/50 transition-colors">
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{fmt(p.date)}</td>
                    <td className="px-3 py-2 font-medium text-dark">{p.weight} kg</td>
                    <td className="px-3 py-2 text-gray-600">{p.bodyFatPercentage ? `${p.bodyFatPercentage}%` : '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{(p.measurements as any)?.waist ? `${(p.measurements as any).waist} cm` : '—'}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs max-w-[120px] truncate">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Routines */}
      <Section title={`Rutinas (${routines.length})`} icon={Dumbbell} defaultOpen={routines.length > 0}>
        {routines.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Sin rutinas asignadas</p>
        ) : (
          <div className="space-y-2 mt-2">
            {routines.map(a => (
              <div key={a.id} className={`rounded-xl p-3 border flex items-start justify-between gap-2 ${a.isActive ? 'border-primary/40 bg-primary/5' : 'border-gray-100 bg-bone'}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-dark text-sm">{a.routine?.name ?? 'Rutina'}</span>
                    {a.isActive && <Badge variant="default" className="text-[10px] px-1.5 py-0">Activa</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {a.routine?.difficulty ? difficultyLabels[a.routine.difficulty] : ''}
                    {a.routine?.targetGoal ? ` · ${goalLabels[a.routine.targetGoal]}` : ''}
                    {a.routine?.durationWeeks ? ` · ${a.routine.durationWeeks} sem` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Desde {fmt(a.startDate)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Memberships */}
      <Section title={`Membresías (${memberships.length})`} icon={CreditCard} defaultOpen={memberships.length > 0}>
        {memberships.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Sin membresías registradas</p>
        ) : (
          <div className="space-y-2 mt-2">
            {memberships.map(m => (
              <div key={m.id} className={`rounded-xl p-3 border ${m.status === 'ACTIVE' ? 'border-primary/40 bg-primary/5' : 'border-gray-100 bg-bone'}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-medium text-dark text-sm">{membershipLabels[m.type]}</span>
                  <Badge variant={membershipStatusMap[m.status]}>{membershipStatusLabels[m.status]}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 mt-2 text-xs text-gray-500">
                  <span>Inicio: <span className="text-dark font-medium">{fmt(m.startDate)}</span></span>
                  <span>Vence: <span className="text-dark font-medium">{fmt(m.endDate)}</span></span>
                  <span className="mt-1">Precio: <span className="text-dark font-medium">₡{Number(m.price).toLocaleString('es-CR')}</span></span>
                  {m.payments && m.payments.length > 0 && (
                    <span className="mt-1">Pagos: <span className="text-dark font-medium">{m.payments.length}</span></span>
                  )}
                </div>
              </div>
            ))}
            {totalPaid > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Total pagado</span>
                <span className="font-bold text-dark">₡{totalPaid.toLocaleString('es-CR')}</span>
              </div>
            )}
          </div>
        )}
      </Section>

    </div>
  );
}
