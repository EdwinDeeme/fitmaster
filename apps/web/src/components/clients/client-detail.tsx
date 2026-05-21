'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { clientsService } from '@/services/clients.service';
import { routinesService } from '@/services/routines.service';
import { Badge } from '@/components/ui/badge';
import { ExerciseLogPanel } from '@/components/routines/exercise-log-panel';
import {
  CreditCard, Dumbbell, TrendingUp, Scale, Activity, Target,
  TrendingDown, Minus, Plus, Check, Calendar, Pencil, X,
  ChevronLeft, ChevronRight, BarChart2, List, MessageSquare, ExternalLink,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── constants ───────────────────────────────────────────────────────────────

const goalLabels: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso', MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento', STRENGTH: 'Fuerza', ENDURANCE: 'Resistencia',
};
const difficultyLabels: Record<string, string> = {
  BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado',
};
const membershipLabels: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual' };
const membershipStatusMap: Record<string, any> = {
  ACTIVE: 'success', EXPIRING_SOON: 'warning', EXPIRED: 'danger', CANCELLED: 'secondary',
};
const membershipStatusLabels: Record<string, string> = {
  ACTIVE: 'Activa', EXPIRING_SOON: 'Por vencer', EXPIRED: 'Vencida', CANCELLED: 'Cancelada',
};
const methodLabels: Record<string, string> = {
  CREDIT_CARD: 'Tarjeta Crédito', DEBIT_CARD: 'Tarjeta Débito', SINPE_MOVIL: 'SINPE Móvil', CASH: 'Efectivo',
};
const genderLabels: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Femenino', OTHER: 'Otro' };

// measure series config
const MEASURE_SERIES = [
  { key: 'cintura', dataKey: 'waist',  label: 'Cintura', color: '#F97316', grad: 'mC' },
  { key: 'pecho',   dataKey: 'chest',  label: 'Pecho',   color: '#A78BFA', grad: 'mW' },
  { key: 'brazos',  dataKey: 'arms',   label: 'Brazos',  color: '#34D399', grad: 'mA' },
  { key: 'caderas', dataKey: 'hips',   label: 'Caderas', color: '#FB7185', grad: 'mH' },
  { key: 'muslos',  dataKey: 'thighs', label: 'Muslos',  color: '#FBBF24', grad: 'mT' },
] as const;

type MeasureKey = typeof MEASURE_SERIES[number]['key'];
type ChartTab = 'peso' | 'grasa' | 'medidas';
type LeftPanel = 'chart' | 'history';

function fmt(d: string) {
  try { return format(parseISO(d), 'dd MMM yy', { locale: es }); } catch { return d; }
}

// ─── sub-components ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark text-white text-xs rounded-xl px-3 py-2 shadow-lg min-w-[100px]">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}{p.unit ?? ''}
        </p>
      ))}
    </div>
  );
}

// Drag-scrollable horizontal chip row
function DragScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check on mount and whenever children change
  const checkScroll = () => {
    const el = ref.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  // Use ResizeObserver to detect when content is rendered
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    checkScroll();
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => ro.disconnect();
  });

  const onMouseDown = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftStart(el.scrollLeft);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    ref.current.scrollLeft = scrollLeftStart - (x - startX);
    checkScroll();
  };
  const stopDrag = () => setIsDragging(false);

  const scroll = (dir: 'left' | 'right') => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === 'left' ? -140 : 140, behavior: 'smooth' });
    setTimeout(checkScroll, 320);
  };

  return (
    <div className="relative flex items-center gap-1">
      {canScrollLeft && (
        <button onClick={() => scroll('left')}
          className="shrink-0 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-bone transition-colors z-10">
          <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
        </button>
      )}
      <div
        ref={ref}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={stopDrag} onMouseLeave={stopDrag}
        onScroll={checkScroll}
        className={`flex gap-2 overflow-x-auto flex-1 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
      {canScrollRight && (
        <button onClick={() => scroll('right')}
          className="shrink-0 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-bone transition-colors z-10">
          <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
        </button>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, trend, accent }: {
  icon: any; label: string; value: string; sub?: string;
  trend?: 'up' | 'down' | 'neutral'; accent?: boolean;
}) {
  const TI = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const tc = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
  return (
    <div className={`rounded-2xl p-3 flex items-start gap-2 ${accent ? 'bg-primary/10 border border-primary/20' : 'bg-bone'}`}>
      <div className={`p-1.5 rounded-lg shrink-0 ${accent ? 'bg-primary/20' : 'bg-white'}`}>
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-gray-500 leading-tight truncate">{label}</p>
        <p className="text-sm font-bold text-dark leading-tight mt-0.5">{value}</p>
        {sub && (
          <div className={`flex items-center gap-0.5 mt-0.5 ${tc}`}>
            {trend && <TI className="h-2.5 w-2.5 shrink-0" />}
            <span className="text-[10px] truncate">{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white';
const inputSmCls = 'w-full h-8 px-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-primary bg-white';

// Note popover
function NotePopover({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1 text-primary hover:text-primary-hover transition-colors">
        <MessageSquare className="h-3.5 w-3.5" />
        <span className="text-[10px] font-medium">Ver</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-6 z-50 w-56 bg-dark text-white text-xs rounded-xl p-3 shadow-xl">
            <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">Nota</p>
            <p className="leading-relaxed">{note}</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ClientDetail({ clientId, onTrackingChange }: {
  clientId: string; onTrackingChange?: (v: boolean) => void;
}) {
  const [showTracking, setShowTracking] = useState(false);
  const [chartTab, setChartTab] = useState<ChartTab>('peso');
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('chart');
  // which measure series are highlighted (empty = all shown)
  const [activeMeasures, setActiveMeasures] = useState<Set<MeasureKey>>(new Set());
  const [logOpen, setLogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(false);
  const [exerciseLogRoutine, setExerciseLogRoutine] = useState<{ id: string; name: string; exercises: string[] } | null>(null);
  const [logWeight, setLogWeight] = useState('');
  const [logFat, setLogFat] = useState('');
  const [logWaist, setLogWaist] = useState('');
  const [logChest, setLogChest] = useState('');
  const [logArms, setLogArms] = useState('');
  const [logHips, setLogHips] = useState('');
  const [logThighs, setLogThighs] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const qc = useQueryClient();

  const toggleTracking = (val: boolean) => { setShowTracking(val); onTrackingChange?.(val); };

  const toggleMeasure = (key: MeasureKey) => {
    setActiveMeasures(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsService.getOne(clientId),
  });

  const progressMutation = useMutation({
    mutationFn: (dto: any) => clientsService.addProgress(clientId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', clientId] });
      setLogOpen(false);
      setLogWeight(''); setLogFat(''); setLogWaist('');
      setLogChest(''); setLogArms(''); setLogHips(''); setLogThighs(''); setLogNotes('');
    },
  });

  const goalMutation = useMutation({
    mutationFn: (dto: any) => clientsService.updateGoal(clientId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', clientId] });
      setEditGoal(false); setGoalWeight(''); setGoalDate('');
    },
  });

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logWeight) return;
    progressMutation.mutate({
      weight: parseFloat(logWeight),
      bodyFatPercentage: logFat ? parseFloat(logFat) : undefined,
      measurements: {
        waist: logWaist ? parseFloat(logWaist) : undefined,
        chest: logChest ? parseFloat(logChest) : undefined,
        arms: logArms ? parseFloat(logArms) : undefined,
        hips: logHips ? parseFloat(logHips) : undefined,
        thighs: logThighs ? parseFloat(logThighs) : undefined,
      },
      notes: logNotes || undefined,
    });
  };

  const handleGoal = (e: React.FormEvent) => {
    e.preventDefault();
    goalMutation.mutate({
      targetWeight: goalWeight ? parseFloat(goalWeight) : undefined,
      targetDate: goalDate || undefined,
    });
  };

  if (isLoading) return (
    <div className="p-8 flex flex-col items-center gap-3 text-gray-400">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-sm">Cargando...</span>
    </div>
  );
  if (!client) return null;

  // ── derived data ──
  const activeMembership = client.memberships?.find(m => m.status === 'ACTIVE' || m.status === 'EXPIRING_SOON');
  const progress = [...(client.physicalProgress ?? [])].reverse();
  const routines = client.routineAssignments ?? [];
  const memberships = client.memberships ?? [];
  const totalPaid = memberships.reduce((a, m) => a + (m.payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0), 0);

  const lastP = progress[progress.length - 1];
  const firstP = progress[0];
  const lastWeight = lastP?.weight ?? client.weight;
  const weightDelta = firstP && lastP && firstP !== lastP ? +(lastP.weight - firstP.weight).toFixed(1) : null;
  const weightTrend = weightDelta === null ? undefined : weightDelta < 0 ? 'down' : weightDelta > 0 ? 'up' : 'neutral';
  const lastFat = lastP?.bodyFatPercentage ?? client.bodyFatPercentage;
  const fatDelta = firstP?.bodyFatPercentage && lastP?.bodyFatPercentage && firstP !== lastP
    ? +(lastP.bodyFatPercentage! - firstP.bodyFatPercentage!).toFixed(1) : null;
  const latestM = lastP?.measurements as any;

  const chartData = progress.map(p => ({
    date: fmt(p.date),
    peso: p.weight,
    grasa: p.bodyFatPercentage ?? null,
    cintura: (p.measurements as any)?.waist ?? null,
    pecho:   (p.measurements as any)?.chest ?? null,
    brazos:  (p.measurements as any)?.arms ?? null,
    caderas: (p.measurements as any)?.hips ?? null,
    muslos:  (p.measurements as any)?.thighs ?? null,
  }));

  const hasFat = chartData.some(d => d.grasa !== null);
  const hasMeasures = MEASURE_SERIES.some(s => chartData.some(d => (d as any)[s.key] !== null));

  // which series to render in medidas chart
  const visibleSeries = MEASURE_SERIES.filter(s =>
    chartData.some(d => (d as any)[s.key] !== null) &&
    (activeMeasures.size === 0 || activeMeasures.has(s.key))
  );

  return (
    <div className="p-4 sm:p-5 space-y-4">

      {/* ── Header ── */}
      <div className="bg-dark rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-base font-bold text-dark shrink-0">
          {client.firstName[0]}{client.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white truncate">{client.firstName} {client.lastName}</h3>
          <p className="text-gray-400 text-xs truncate">{client.email}</p>
          {client.phone && <p className="text-gray-400 text-xs">{client.phone}</p>}
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <Badge variant={client.status === 'ACTIVE' ? 'success' : 'warning'}>
              {client.status === 'ACTIVE' ? 'Activo' : client.status}
            </Badge>
            <Badge variant="info">{goalLabels[client.goalType]}</Badge>
          </div>
        </div>
        <button
          onClick={() => toggleTracking(!showTracking)}
          className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
            showTracking ? 'bg-primary border-primary text-dark' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span className="text-[10px] font-semibold leading-none whitespace-nowrap">
            {showTracking ? 'Ver info' : 'Seguimiento'}
          </span>
        </button>
      </div>

      {/* ── TAB: Info básica ── */}
      {!showTracking && (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Datos físicos</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Peso',       value: `${client.weight} kg` },
                { label: 'Altura',     value: `${client.height} cm` },
                { label: 'IMC',        value: client.bmi.toFixed(1) },
                { label: 'Género',     value: genderLabels[client.gender] },
                { label: '% Grasa',    value: client.bodyFatPercentage ? `${client.bodyFatPercentage}%` : '—' },
                { label: 'Nacimiento', value: new Date(client.dateOfBirth).toLocaleDateString('es-CR') },
              ].map(({ label, value }) => (
                <div key={label} className="bg-bone rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400">{label}</p>
                  <p className="font-semibold text-dark text-xs mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Temp password */}
          {(client as any).tempPassword && (
            <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5">
              <div>
                <p className="text-[10px] font-semibold text-yellow-700 uppercase tracking-wide">Contraseña temporal</p>
                <p className="font-mono font-bold text-dark text-sm mt-0.5">{(client as any).tempPassword}</p>
              </div>
              <span className="text-[10px] text-yellow-600 bg-yellow-100 px-2 py-1 rounded-lg">Pendiente cambio</span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Membresía activa</p>
            </div>
            {activeMembership ? (
              <div className="bg-bone rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-dark text-sm">{membershipLabels[activeMembership.type]}</span>
                  <span className="font-bold text-dark text-sm">₡{Number(activeMembership.price).toLocaleString('es-CR')}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{new Date(activeMembership.startDate).toLocaleDateString('es-CR')}</span>
                  <span>→</span>
                  <span>{new Date(activeMembership.endDate).toLocaleDateString('es-CR')}</span>
                </div>
                {activeMembership.payments?.[0] && (
                  <p className="text-[11px] text-gray-400 border-t border-gray-200 pt-1.5">
                    Último pago: {new Date(activeMembership.payments[0].createdAt).toLocaleDateString('es-CR')} · {methodLabels[activeMembership.payments[0].method]}
                  </p>
                )}
              </div>
            ) : <p className="text-xs text-gray-400 bg-bone rounded-xl p-3">Sin membresía activa</p>}
          </div>
          {routines.filter(a => a.isActive).length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Dumbbell className="h-3.5 w-3.5 text-primary" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Rutina activa</p>
              </div>
              {routines.filter(a => a.isActive).map(a => (
                <div key={a.id} className="bg-bone rounded-xl p-3">
                  <p className="font-medium text-dark text-sm">{a.routine?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {a.routine?.difficulty && difficultyLabels[a.routine.difficulty]} · Desde {new Date(a.startDate).toLocaleDateString('es-CR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Seguimiento ── */}
      {showTracking && (
        <div className="space-y-4">

          {/* KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
            <KpiCard icon={Scale} label="Peso actual" value={`${lastWeight} kg`}
              sub={weightDelta !== null ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg` : 'Sin historial'}
              trend={weightTrend} accent />
            <KpiCard icon={Activity} label="% Grasa" value={lastFat ? `${lastFat}%` : '—'}
              sub={fatDelta !== null ? `${fatDelta > 0 ? '+' : ''}${fatDelta}%` : undefined}
              trend={fatDelta === null ? undefined : fatDelta < 0 ? 'down' : 'up'} />
            <KpiCard icon={Target} label="Objetivo" value={client.targetWeight ? `${client.targetWeight} kg` : '—'}
              sub={client.targetWeight ? (() => {
                const diff = +(lastWeight - client.targetWeight).toFixed(1);
                const isGain = ['MUSCLE_GAIN', 'STRENGTH', 'ENDURANCE'].includes(client.goalType);
                const reached = isGain ? lastWeight >= client.targetWeight : lastWeight <= client.targetWeight;
                if (reached) return '✓ Objetivo alcanzado';
                return `Faltan ${Math.abs(diff)} kg`;
              })() : undefined} />
            <KpiCard icon={Dumbbell} label="Rutinas" value={String(routines.length)}
              sub={routines.find(r => r.isActive)?.routine?.name ?? 'Sin rutina activa'} />
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

            {/* ── LEFT: Chart ↔ History toggle panel ── */}
            <div className="xl:col-span-3">
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">

                {/* Panel header */}
                <div className="flex items-center gap-2 px-4 pt-4 pb-3">
                  {leftPanel === 'chart' ? (
                    <>
                      <div className="flex items-center gap-1 bg-bone rounded-xl p-1">
                        {([
                          { key: 'peso',    label: 'Peso' },
                          ...(hasFat      ? [{ key: 'grasa',   label: '% Grasa' }] : []),
                          ...(hasMeasures ? [{ key: 'medidas', label: 'Medidas' }] : []),
                        ] as { key: ChartTab; label: string }[]).map(t => (
                          <button key={t.key} onClick={() => setChartTab(t.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              chartTab === t.key ? 'bg-primary text-dark shadow-sm' : 'text-gray-500 hover:text-dark'
                            }`}
                          >{t.label}</button>
                        ))}
                      </div>
                      <button onClick={() => setLeftPanel('history')}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bone hover:bg-gray-200 transition-colors text-xs font-semibold text-gray-600 shrink-0">
                        <List className="h-3.5 w-3.5" />
                        Ver historial
                      </button>
                    </>
                  ) : (
                    <>
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-xs font-semibold text-dark flex-1">
                        Historial ({progress.length} registros)
                      </span>
                      <button onClick={() => setLeftPanel('chart')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bone hover:bg-gray-200 transition-colors text-xs font-semibold text-gray-600 shrink-0">
                        <BarChart2 className="h-3.5 w-3.5" />
                        Ver gráfica
                      </button>
                    </>
                  )}
                </div>

                {/* ── CHART VIEW ── */}
                {leftPanel === 'chart' && (
                  <div className="px-4 pb-4 space-y-3">
                    {chartData.length < 2 ? (
                      <div className="h-44 flex flex-col items-center justify-center gap-2 text-gray-400">
                        <Scale className="h-8 w-8 opacity-30" />
                        <p className="text-sm">Registra al menos 2 mediciones para ver la gráfica</p>
                      </div>
                    ) : (
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartTab === 'peso' ? (
                            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                              <defs>
                                <linearGradient id="wG" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#C1EF00" stopOpacity={0.35} />
                                  <stop offset="95%" stopColor="#C1EF00" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F6" />
                              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                              <Tooltip content={<ChartTooltip />} />
                              {client.targetWeight && (
                                <ReferenceLine y={client.targetWeight} stroke="#C1EF00" strokeDasharray="4 4"
                                  label={{ value: `Obj. ${client.targetWeight}kg`, position: 'insideTopRight', fontSize: 9, fill: '#8FB800' }} />
                              )}
                              <Area type="monotone" dataKey="peso" name="Peso" unit=" kg" stroke="#C1EF00" strokeWidth={2.5}
                                fill="url(#wG)" dot={{ fill: '#C1EF00', r: 3 }} activeDot={{ r: 5 }} />
                            </AreaChart>
                          ) : chartTab === 'grasa' ? (
                            <AreaChart data={chartData.filter(d => d.grasa !== null)} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                              <defs>
                                <linearGradient id="fG" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F6" />
                              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                              <Tooltip content={<ChartTooltip />} />
                              <Area type="monotone" dataKey="grasa" name="% Grasa" unit="%" stroke="#60A5FA" strokeWidth={2.5}
                                fill="url(#fG)" dot={{ fill: '#60A5FA', r: 3 }} activeDot={{ r: 5 }} />
                            </AreaChart>
                          ) : (
                            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                              <defs>
                                {MEASURE_SERIES.map(s => (
                                  <linearGradient key={s.grad} id={s.grad} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={s.color} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                                  </linearGradient>
                                ))}
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F6" />
                              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                              <Tooltip content={<ChartTooltip />} />
                              {visibleSeries.map(s => (
                                <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} unit=" cm"
                                  stroke={s.color} strokeWidth={activeMeasures.has(s.key) ? 3 : 2}
                                  fill={`url(#${s.grad})`} dot={{ fill: s.color, r: activeMeasures.has(s.key) ? 4 : 2.5 }}
                                  activeDot={{ r: 5 }} connectNulls
                                  opacity={activeMeasures.size === 0 || activeMeasures.has(s.key) ? 1 : 0.25} />
                              ))}
                            </AreaChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Measure chips with drag scroll */}
                    {latestM && Object.values(latestM).some(v => v) && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Últimas medidas</p>
                          {chartTab === 'medidas' && activeMeasures.size > 0 && (
                            <button onClick={() => setActiveMeasures(new Set())}
                              className="text-[10px] text-primary hover:underline">ver todas</button>
                          )}
                        </div>
                        <DragScrollRow>
                          {MEASURE_SERIES.map(s => {
                            const val = latestM?.[s.dataKey];
                            if (!val) return null;
                            const isActive = activeMeasures.has(s.key);
                            const isFilterable = chartTab === 'medidas';
                            return isFilterable ? (
                              <button key={s.key} onClick={() => toggleMeasure(s.key)}
                                className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                                  isActive ? 'text-white border-transparent shadow-sm' : 'bg-bone border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                                style={isActive ? { backgroundColor: s.color, borderColor: s.color } : {}}
                              >
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                {s.label} <span className="font-bold">{val} cm</span>
                              </button>
                            ) : (
                              <span key={s.key} className="flex-shrink-0 inline-flex items-center gap-1.5 bg-bone rounded-full px-3 py-1.5 text-xs">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                <span className="text-gray-500">{s.label}</span>
                                <span className="font-bold text-dark">{val} cm</span>
                              </span>
                            );
                          })}
                        </DragScrollRow>
                      </div>
                    )}
                  </div>
                )}

                {/* ── HISTORY VIEW ── */}
                {leftPanel === 'history' && (
                  <div>
                    {progress.length === 0 ? (
                      <div className="px-4 pb-6 pt-2 text-center text-sm text-gray-400">Sin registros aún</div>
                    ) : (
                      <table className="w-full table-fixed">
                        <thead className="bg-bone">
                          <tr>
                            <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[18%]">Fecha</th>
                            <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[12%]">Peso</th>
                            <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[11%]">Grasa</th>
                            <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[12%]">Cintura</th>
                            <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[11%]">Pecho</th>
                            <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[11%]">Brazos</th>
                            <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[12%]">Caderas</th>
                            <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[11%]">Muslos</th>
                            <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[12%]">Nota</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {[...progress].reverse().map(p => {
                            const m = p.measurements as any;
                            return (
                              <tr key={p.id} className="hover:bg-bone/50 transition-colors">
                                <td className="px-2 py-2 text-[10px] text-gray-600 font-medium">{fmt(p.date)}</td>
                                <td className="px-2 py-2 text-[10px] font-bold text-dark">{p.weight} kg</td>
                                <td className="px-2 py-2 text-[10px] text-gray-600">{p.bodyFatPercentage ? `${p.bodyFatPercentage}%` : '—'}</td>
                                <td className="px-2 py-2 text-[10px] text-gray-600">{m?.waist  ?? '—'}</td>
                                <td className="px-2 py-2 text-[10px] text-gray-600">{m?.chest  ?? '—'}</td>
                                <td className="px-2 py-2 text-[10px] text-gray-600">{m?.arms   ?? '—'}</td>
                                <td className="px-2 py-2 text-[10px] text-gray-600">{m?.hips   ?? '—'}</td>
                                <td className="px-2 py-2 text-[10px] text-gray-600">{m?.thighs ?? '—'}</td>
                                <td className="px-2 py-2 text-[10px]">
                                  {p.notes ? <NotePopover note={p.notes} /> : <span className="text-gray-300">—</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* ── RIGHT: Log + Goal + Routines + Memberships ── */}
            <div className="xl:col-span-2 space-y-3">

              {/* Nueva medición — overlay trigger */}
              <div className="relative">
                <button onClick={() => setLogOpen(o => !o)}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all ${
                    logOpen
                      ? 'bg-primary border-primary text-dark'
                      : 'bg-white border-primary/25 hover:bg-primary/5 text-dark'
                  }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${logOpen ? 'bg-dark/20' : 'bg-primary'}`}>
                    {logOpen ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3 text-dark" />}
                  </div>
                  <span className="font-semibold text-sm flex-1 text-left">
                    {logOpen ? 'Cancelar' : 'Nueva medición'}
                  </span>
                </button>

                {/* Overlay form — floats over content below */}
                {logOpen && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-primary/20 rounded-2xl shadow-xl">
                    <form onSubmit={handleLog} className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Peso (kg) *</label>
                          <input type="number" step="0.1" required value={logWeight}
                            onChange={e => setLogWeight(e.target.value)} placeholder={`${client.weight}`}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">% Grasa</label>
                          <input type="number" step="0.1" value={logFat}
                            onChange={e => setLogFat(e.target.value)} placeholder="Opcional"
                            className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Medidas cm (opcional)</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { l: 'Cintura', v: logWaist,  s: setLogWaist },
                            { l: 'Pecho',   v: logChest,  s: setLogChest },
                            { l: 'Brazos',  v: logArms,   s: setLogArms },
                            { l: 'Caderas', v: logHips,   s: setLogHips },
                            { l: 'Muslos',  v: logThighs, s: setLogThighs },
                          ].map(({ l, v, s }) => (
                            <div key={l}>
                              <label className="text-[9px] text-gray-400 block mb-0.5">{l}</label>
                              <input type="number" step="0.1" value={v}
                                onChange={e => s(e.target.value)} placeholder="—"
                                className={inputSmCls} />
                            </div>
                          ))}
                        </div>
                      </div>
                      <textarea value={logNotes} onChange={e => setLogNotes(e.target.value)}
                        placeholder="Notas opcionales..." rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white" />
                      <button type="submit" disabled={progressMutation.isPending || !logWeight}
                        className="w-full h-9 bg-primary text-dark font-semibold text-sm rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                        {progressMutation.isPending
                          ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                          : <><Check className="h-3.5 w-3.5" /> Guardar medición</>}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Objetivo de peso */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-dark flex-1">Objetivo de peso</span>
                  {!editGoal && (
                    <button onClick={() => { setEditGoal(true); setGoalWeight(client.targetWeight ? String(client.targetWeight) : ''); }}
                      className="p-1 rounded-lg hover:bg-bone transition-colors text-gray-400 hover:text-dark">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {editGoal && (
                    <button onClick={() => setEditGoal(false)}
                      className="p-1 rounded-lg hover:bg-bone transition-colors text-gray-400 hover:text-dark">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {!editGoal ? (
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-dark">
                      {client.targetWeight ? `${client.targetWeight} kg` : '—'}
                    </span>
                    {client.targetDate && (
                      <span className="text-xs text-gray-400">
                        para {new Date(client.targetDate).toLocaleDateString('es-CR')}
                      </span>
                    )}
                    {client.targetWeight && (
                      <span className={`ml-auto text-xs font-semibold ${
                        (() => {
                          const isGain = ['MUSCLE_GAIN', 'STRENGTH', 'ENDURANCE'].includes(client.goalType);
                          const reached = isGain ? lastWeight >= client.targetWeight : lastWeight <= client.targetWeight;
                          return reached ? 'text-green-500' : 'text-red-400';
                        })()
                      }`}>
                        {(() => {
                          const isGain = ['MUSCLE_GAIN', 'STRENGTH', 'ENDURANCE'].includes(client.goalType);
                          const reached = isGain ? lastWeight >= client.targetWeight : lastWeight <= client.targetWeight;
                          if (reached) return '✓ Alcanzado';
                          const diff = +(lastWeight - client.targetWeight).toFixed(1);
                          return isGain
                            ? `Faltan +${Math.abs(diff)} kg`
                            : `−${Math.abs(diff)} kg`;
                        })()}
                      </span>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleGoal} className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Peso (kg)</label>
                        <input type="number" step="0.1" value={goalWeight}
                          onChange={e => setGoalWeight(e.target.value)}
                          placeholder={client.targetWeight ? `${client.targetWeight}` : 'Ej: 70'}
                          className={inputCls} />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Fecha</label>
                        <input type="date" value={goalDate} onChange={e => setGoalDate(e.target.value)}
                          className={inputCls} />
                      </div>
                    </div>
                    <button type="submit" disabled={goalMutation.isPending}
                      className="w-full h-9 bg-dark text-white font-semibold text-sm rounded-xl hover:bg-dark/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                      {goalMutation.isPending
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><Check className="h-3.5 w-3.5" /> Guardar objetivo</>}
                    </button>
                  </form>
                )}
              </div>

              {/* Rutinas */}
              {routines.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-dark">Rutinas ({routines.length})</span>
                  </div>
                  {routines.map(a => {
                    // Extract exercise names from weeklySchedule
                    const getExercises = () => {
                      if (!a.routine) return [];
                      // We need the full routine to get exercises — use routineId to fetch
                      return [];
                    };
                    return (
                      <button key={a.id}
                        onClick={() => {
                          // Fetch full routine to get exercises
                          routinesService.getById(a.routineId).then(r => {
                            const exercises = Object.values(r.weeklySchedule ?? {})
                              .flatMap((day: any) => day.exercises?.map((e: any) => e.name) ?? [])
                              .filter((v, i, arr) => arr.indexOf(v) === i); // unique
                            setExerciseLogRoutine({ id: a.routineId, name: r.name, exercises });
                          });
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs gap-2 transition-colors hover:opacity-80 text-left ${a.isActive ? 'bg-primary/5 border border-primary/20' : 'bg-bone'}`}>
                        <span className="font-medium text-dark truncate">{a.routine?.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-gray-400">{fmt(a.startDate)}</span>
                          <Dumbbell className="h-3 w-3 text-primary" />
                        </div>
                      </button>
                    );
                  })}
                  <p className="text-[10px] text-gray-400 text-center pt-1">Toca una rutina para ver el historial de pesos</p>
                </div>
              )}

              {/* Membresías → link a finanzas */}
              {memberships.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-dark">Membresías ({memberships.length})</span>
                    </div>
                    {totalPaid > 0 && <span className="text-xs font-bold text-dark">₡{totalPaid.toLocaleString('es-CR')}</span>}
                  </div>
                  {memberships.map(m => (
                    <a key={m.id} href={`/finances?clientId=${client.id}`}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs gap-2 transition-colors hover:opacity-80 ${m.status === 'ACTIVE' ? 'bg-primary/5 border border-primary/20' : 'bg-bone'}`}>
                      <span className="font-medium text-dark">{membershipLabels[m.type]}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant={membershipStatusMap[m.status]}>{membershipStatusLabels[m.status]}</Badge>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                    </a>
                  ))}
                  <a href={`/finances?clientId=${client.id}`}
                    className="flex items-center justify-center gap-1.5 w-full mt-1 py-2 rounded-xl bg-bone hover:bg-gray-200 transition-colors text-xs font-semibold text-gray-600">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver historial de pagos
                  </a>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Exercise log panel */}
      {exerciseLogRoutine && (
        <ExerciseLogPanel
          clientId={clientId}
          routineId={exerciseLogRoutine.id}
          routineName={exerciseLogRoutine.name}
          exercises={exerciseLogRoutine.exercises}
          onClose={() => setExerciseLogRoutine(null)}
        />
      )}
    </div>
  );
}
