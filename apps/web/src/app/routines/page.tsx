'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { routinesService } from '@/services/routines.service';
import { clientsService } from '@/services/clients.service';
import { UserRole } from '@/types/auth';
import { Routine } from '@/types/gym';
import { Plus, Search, Eye, Edit2, Trash2, ClipboardList, UserPlus } from 'lucide-react';
import { RoutineForm } from '@/components/routines/routine-form';
import { RoutineDetail } from '@/components/routines/routine-detail';
import { AssignRoutineForm } from '@/components/routines/assign-routine-form';

const difficultyConfig: Record<string, { label: string; variant: any }> = {
  BEGINNER: { label: 'Principiante', variant: 'success' },
  INTERMEDIATE: { label: 'Intermedio', variant: 'warning' },
  ADVANCED: { label: 'Avanzado', variant: 'danger' },
};
const goalLabels: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso', MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento', STRENGTH: 'Fuerza', ENDURANCE: 'Resistencia',
};

export default function RoutinesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editRoutine, setEditRoutine] = useState<Routine | null>(null);
  const [viewRoutine, setViewRoutine] = useState<Routine | null>(null);
  const [assignRoutine, setAssignRoutine] = useState<Routine | null>(null);

  const { data: routines = [], isLoading } = useQuery({ queryKey: ['routines'], queryFn: routinesService.getAll });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientsService.getAll });

  const deleteMutation = useMutation({
    mutationFn: routinesService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });

  const filtered = routines.filter(r =>
    `${r.name} ${r.creator?.firstName} ${r.creator?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={[UserRole.GYM_ADMIN, UserRole.TRAINER]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-xl"><ClipboardList className="h-6 w-6 text-purple-600" /></div>
              <div><h1 className="text-2xl font-bold text-dark">Rutinas</h1><p className="text-sm text-gray-500">{routines.length} rutinas registradas</p></div>
            </div>
            <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2"><Plus className="h-4 w-4" />Nueva Rutina</Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar por nombre o entrenador..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bone border-b border-gray-100">
                  <tr>{['Rutina', 'Objetivo', 'Dificultad', 'Duración', 'Creada por', 'Asignaciones', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No se encontraron rutinas</td></tr>
                  : filtered.map(r => (
                    <tr key={r.id} className="hover:bg-bone/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-dark">{r.name}</p>
                        {r.isAIGenerated && <Badge variant="info" className="text-xs mt-0.5">IA</Badge>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{goalLabels[r.targetGoal]}</td>
                      <td className="px-4 py-3"><Badge variant={difficultyConfig[r.difficulty]?.variant}>{difficultyConfig[r.difficulty]?.label}</Badge></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.durationWeeks} sem.</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.creator?.firstName} {r.creator?.lastName}</td>
                      <td className="px-4 py-3 text-sm text-center">{r._count?.assignments ?? r.assignments?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewRoutine(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Eye className="h-4 w-4" /></button>
                          <button onClick={() => setAssignRoutine(r)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"><UserPlus className="h-4 w-4" /></button>
                          <button onClick={() => setEditRoutine(r)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => { if (confirm('¿Eliminar rutina?')) deleteMutation.mutate(r.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva Rutina" size="lg">
          <RoutineForm onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['routines'] }); }} onCancel={() => setShowCreate(false)} />
        </Modal>
        <Modal open={!!editRoutine} onClose={() => setEditRoutine(null)} title="Editar Rutina" size="lg">
          {editRoutine && <RoutineForm routine={editRoutine} onSuccess={() => { setEditRoutine(null); qc.invalidateQueries({ queryKey: ['routines'] }); }} onCancel={() => setEditRoutine(null)} />}
        </Modal>
        <Modal open={!!viewRoutine} onClose={() => setViewRoutine(null)} title="Detalle de Rutina" size="lg">
          {viewRoutine && <RoutineDetail routine={viewRoutine} />}
        </Modal>
        <Modal open={!!assignRoutine} onClose={() => setAssignRoutine(null)} title="Asignar Rutina" size="sm">
          {assignRoutine && <AssignRoutineForm routine={assignRoutine} clients={clients} onSuccess={() => { setAssignRoutine(null); qc.invalidateQueries({ queryKey: ['routines'] }); }} onCancel={() => setAssignRoutine(null)} />}
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
