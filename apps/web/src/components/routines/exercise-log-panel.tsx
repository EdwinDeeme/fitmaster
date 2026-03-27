'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routinesService } from '@/services/routines.service';
import { ExerciseLog } from '@/types/routines';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dumbbell, Plus, Check, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, X,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

function fmt(d: string) {
  try { return format(parseISO(d), 'dd MMM', { locale: es }); } catch { return d; }
}

function Tooltip2({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark text-white text-xs rounded-xl px-3 py-2 shadow-lg">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value} kg</p>
      ))}
    </div>
  );
}

interface Props {
  clientId: string;
  routineId: string;
  routineName: string;
  exercises: string[]; // exercise names from the routine's weeklySchedule
  onClose: () => void;
}

export function ExerciseLogPanel({ clientId, routineId, routineName, exercises, onClose }: Props) {
  const qc = useQueryClient();
  const [selectedExercise, setSelectedExercise] = useState<string>(exercises[0] ?? '');
  const [logOpen, setLogOpen] = useState(false);
  const [logWeight, setLogWeight] = useState('');
  const [logSets, setLogSets] = useState('');
  const [logReps, setLogReps] = useState('');
  const [logWeek, setLogWeek] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const { data: logsGrouped = {}, isLoading } = useQuery({
    queryKey: ['exercise-logs', clientId, routineId],
    queryFn: () => routinesService.getExerciseLogs(clientId, routineId),
  });

  const logMutation = useMutation({
    mutationFn: (dto: any) => routinesService.logExercise(clientId, routineId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercise-logs', clientId, routineId] });
      setLogOpen(false);
      setLogWeight(''); setLogSets(''); setLogReps(''); setLogWeek(''); setLogNotes('');
    },
  });

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logWeight || !selectedExercise) return;
    logMutation.mutate({
      exerciseName: selectedExercise,
      sets: parseInt(logSets) || 3,
      reps: logReps || '10',
      weightKg: parseFloat(logWeight),
      weekNumber: logWeek ? parseInt(logWeek) : undefined,
      notes: logNotes || undefined,
    });
  };

  const currentLogs: ExerciseLog[] = logsGrouped[selectedExercise] ?? [];
  const chartData = currentLogs.map(l => ({ date: fmt(l.date), peso: l.weightKg, semana: l.weekNumber }));

  const firstW = currentLogs[0]?.weightKg;
  const lastW = currentLogs[currentLogs.length - 1]?.weightKg;
  const delta = firstW && lastW && firstW !== lastW ? +(lastW - firstW).toFixed(1) : null;
  const TrendIcon = delta === null ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const trendColor = delta === null ? 'text-gray-400' : delta > 0 ? 'text-green-500' : 'text-red-400';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-dark">
          <Dumbbell className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{routineName}</h3>
            <p className="text-[11px] text-gray-400">Historial de pesos por ejercicio</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[80vh] p-4 sm:p-5 space-y-4">

          {/* Exercise selector */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Ejercicio</p>
            <div className="flex flex-wrap gap-2">
              {exercises.map(ex => (
                <button key={ex} onClick={() => setSelectedExercise(ex)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    selectedExercise === ex
                      ? 'bg-primary border-primary text-dark'
                      : 'bg-bone border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Stats for selected exercise */}
          {currentLogs.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-bone rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500">Último peso</p>
                <p className="text-base font-bold text-dark">{lastW} kg</p>
              </div>
              <div className="bg-bone rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500">Mejor peso</p>
                <p className="text-base font-bold text-dark">{Math.max(...currentLogs.map(l => l.weightKg))} kg</p>
              </div>
              <div className={`bg-bone rounded-xl p-3 text-center`}>
                <p className="text-[10px] text-gray-500">Progreso</p>
                <div className={`flex items-center justify-center gap-1 ${trendColor}`}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  <p className="text-base font-bold">{delta !== null ? `${delta > 0 ? '+' : ''}${delta} kg` : '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 1 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Evolución de peso</p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F6" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<Tooltip2 />} />
                    <Line type="monotone" dataKey="peso" name="Peso" stroke="#C1EF00" strokeWidth={2.5}
                      dot={{ fill: '#C1EF00', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Log new weight */}
          <div className="border border-primary/25 rounded-2xl overflow-hidden">
            <button onClick={() => setLogOpen(o => !o)}
              className={`w-full flex items-center gap-2 px-4 py-3 transition-colors ${logOpen ? 'bg-primary' : 'bg-primary/5 hover:bg-primary/10'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${logOpen ? 'bg-dark/20' : 'bg-primary'}`}>
                {logOpen ? <X className="h-3 w-3 text-dark" /> : <Plus className="h-3 w-3 text-dark" />}
              </div>
              <span className={`font-semibold text-sm flex-1 text-left ${logOpen ? 'text-dark' : 'text-dark'}`}>
                {logOpen ? 'Cancelar' : 'Registrar peso'}
              </span>
            </button>
            {logOpen && (
              <form onSubmit={handleLog} className="bg-white px-4 pb-4 pt-3 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Peso (kg) *</label>
                    <input type="number" step="0.5" required value={logWeight}
                      onChange={e => setLogWeight(e.target.value)}
                      placeholder={lastW ? `${lastW}` : 'Ej: 60'}
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Series</label>
                    <input type="number" min="1" value={logSets}
                      onChange={e => setLogSets(e.target.value)} placeholder="3"
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Reps</label>
                    <input type="text" value={logReps}
                      onChange={e => setLogReps(e.target.value)} placeholder="10 o 8-12"
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Semana</label>
                    <input type="number" min="1" value={logWeek}
                      onChange={e => setLogWeek(e.target.value)} placeholder="1"
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <input type="text" value={logNotes} onChange={e => setLogNotes(e.target.value)}
                  placeholder="Notas opcionales..."
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                <button type="submit" disabled={logMutation.isPending || !logWeight}
                  className="w-full h-9 bg-primary text-dark font-semibold text-sm rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {logMutation.isPending
                    ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                    : <><Check className="h-3.5 w-3.5" /> Guardar</>}
                </button>
              </form>
            )}
          </div>

          {/* History table */}
          {currentLogs.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-100">
                Historial — {selectedExercise}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bone">
                    <tr>
                      {['Fecha', 'Peso', 'Series', 'Reps', 'Semana', 'Notas'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...currentLogs].reverse().map(l => (
                      <tr key={l.id} className="hover:bg-bone/50 transition-colors">
                        <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{fmt(l.date)}</td>
                        <td className="px-3 py-2 text-xs font-bold text-dark">{l.weightKg} kg</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{l.sets}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{l.reps}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{l.weekNumber ?? '—'}</td>
                        <td className="px-3 py-2 text-xs text-gray-400 max-w-[120px] truncate">{l.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentLogs.length === 0 && !isLoading && (
            <div className="text-center py-6 text-gray-400 text-sm">
              Sin registros para {selectedExercise}. ¡Registra el primer peso!
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
