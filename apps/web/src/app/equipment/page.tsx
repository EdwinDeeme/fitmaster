'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { equipmentService } from '@/services/equipment.service';
import { UserRole } from '@/types/auth';
import { Equipment } from '@/types/gym';
import { Plus, Search, Edit2, Trash2, Wrench, Dumbbell, AlertTriangle } from 'lucide-react';
import { EquipmentForm } from '@/components/equipment/equipment-form';
import { MaintenanceForm } from '@/components/equipment/maintenance-form';

const statusConfig: Record<string, { label: string; variant: any }> = {
  OPERATIONAL: { label: 'Operativo', variant: 'success' },
  MAINTENANCE: { label: 'En mantenimiento', variant: 'warning' },
  DAMAGED: { label: 'Dañado', variant: 'danger' },
  OUT_OF_SERVICE: { label: 'Fuera de servicio', variant: 'secondary' },
};
const categoryLabels: Record<string, string> = { CARDIO: 'Cardio', STRENGTH: 'Fuerza', FREE_WEIGHTS: 'Pesas Libres', FUNCTIONAL: 'Funcional', ACCESSORIES: 'Accesorios' };

export default function EquipmentPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editEquipment, setEditEquipment] = useState<Equipment | null>(null);
  const [maintenanceEquipment, setMaintenanceEquipment] = useState<Equipment | null>(null);

  const { data: equipment = [], isLoading } = useQuery({ queryKey: ['equipment'], queryFn: equipmentService.getAll });
  const { data: catalog = [] } = useQuery({ queryKey: ['equipment-catalog'], queryFn: equipmentService.getCatalog });

  const deleteMutation = useMutation({
    mutationFn: equipmentService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  });

  const filtered = equipment.filter(e =>
    `${e.name} ${e.brand ?? ''} ${e.category}`.toLowerCase().includes(search.toLowerCase())
  );

  const needsMaintenance = equipment.filter(e => e.nextMaintenance && new Date(e.nextMaintenance) <= new Date());

  return (
    <ProtectedRoute allowedRoles={[UserRole.GYM_ADMIN, UserRole.TRAINER]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-xl"><Dumbbell className="h-6 w-6 text-orange-600" /></div>
              <div><h1 className="text-2xl font-bold text-dark">Equipamiento</h1><p className="text-sm text-gray-500">{equipment.length} equipos registrados</p></div>
            </div>
            <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2"><Plus className="h-4 w-4" />Agregar Equipo</Button>
          </div>

          {needsMaintenance.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">{needsMaintenance.length} equipo(s) requieren mantenimiento: {needsMaintenance.map(e => e.name).join(', ')}</p>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar equipo..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bone border-b border-gray-100">
                  <tr>{['Equipo', 'Categoría', 'Marca', 'Estado', 'Último Mant.', 'Próximo Mant.', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No se encontró equipamiento</td></tr>
                  : filtered.map(eq => (
                    <tr key={eq.id} className="hover:bg-bone/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-dark">{eq.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{categoryLabels[eq.category]}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{eq.brand || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={statusConfig[eq.status]?.variant}>{statusConfig[eq.status]?.label}</Badge></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{eq.lastMaintenance ? new Date(eq.lastMaintenance).toLocaleDateString('es-CR') : '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        {eq.nextMaintenance ? (
                          <span className={new Date(eq.nextMaintenance) <= new Date() ? 'text-red-500 font-medium' : 'text-gray-600'}>
                            {new Date(eq.nextMaintenance).toLocaleDateString('es-CR')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setMaintenanceEquipment(eq)} className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600"><Wrench className="h-4 w-4" /></button>
                          <button onClick={() => setEditEquipment(eq)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => { if (confirm('¿Eliminar equipo?')) deleteMutation.mutate(eq.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Agregar Equipo" size="md">
          <EquipmentForm catalog={catalog} onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['equipment'] }); }} onCancel={() => setShowCreate(false)} />
        </Modal>
        <Modal open={!!editEquipment} onClose={() => setEditEquipment(null)} title="Editar Equipo" size="md">
          {editEquipment && <EquipmentForm equipment={editEquipment} catalog={catalog} onSuccess={() => { setEditEquipment(null); qc.invalidateQueries({ queryKey: ['equipment'] }); }} onCancel={() => setEditEquipment(null)} />}
        </Modal>
        <Modal open={!!maintenanceEquipment} onClose={() => setMaintenanceEquipment(null)} title="Registrar Mantenimiento" size="sm">
          {maintenanceEquipment && <MaintenanceForm equipment={maintenanceEquipment} onSuccess={() => { setMaintenanceEquipment(null); qc.invalidateQueries({ queryKey: ['equipment'] }); }} onCancel={() => setMaintenanceEquipment(null)} />}
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
