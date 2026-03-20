'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { equipmentService } from '@/services/equipment.service';
import { UserRole } from '@/types/auth';
import { Equipment } from '@/types/gym';
import { Plus, Search, Trash2, Wrench, Dumbbell, AlertTriangle, X, Pencil, ChevronRight, Tag, Activity, CalendarClock, CalendarCheck, ShoppingCart, RefreshCw, Check } from 'lucide-react';
import { EquipmentForm } from '@/components/equipment/equipment-form';
import { MaintenanceForm } from '@/components/equipment/maintenance-form';
import { useAuth } from '@/contexts/auth.context';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const statusConfig: Record<string, { label: string; variant: any }> = {
  OPERATIONAL:    { label: 'Operativo',          variant: 'success'   },
  MAINTENANCE:    { label: 'En mantenimiento',   variant: 'warning'   },
  DAMAGED:        { label: 'Dañado',             variant: 'danger'    },
  OUT_OF_SERVICE: { label: 'Fuera de servicio',  variant: 'secondary' },
};
const categoryLabels: Record<string, string> = {
  CARDIO: 'Cardio', STRENGTH: 'Fuerza', FREE_WEIGHTS: 'Pesas Libres',
  FUNCTIONAL: 'Funcional', ACCESSORIES: 'Accesorios',
};
const maintenanceTypeLabels: Record<string, string> = {
  ROUTINE: 'Rutinario', REPAIR: 'Reparación', REPLACEMENT: 'Reemplazo',
};

function extractShortId(ref: string | null, prefix: string) {
  if (!ref) return null;
  const pattern = new RegExp(`-${prefix}-([a-f0-9]{8})$`, 'i');
  const match = ref.match(pattern);
  return match?.[1]?.toLowerCase() ?? null;
}

export default function EquipmentPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const isAdmin = user?.role === UserRole.GYM_ADMIN;
  const openedFromQueryRef = useRef(false);
  const equipmentIdFromQuery = searchParams.get('equipmentId');
  const maintenanceIdFromQuery = searchParams.get('maintenanceId');
  const equipmentRefFromQuery = searchParams.get('equipment');
  const maintenanceRefFromQuery = searchParams.get('maintenance');
  const equipmentShortId = extractShortId(equipmentRefFromQuery, 'e');
  const maintenanceShortId = extractShortId(maintenanceRefFromQuery, 'm');

  const [search, setSearch]           = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [detailEq, setDetailEq]       = useState<Equipment | null>(null);
  const [editEq, setEditEq]           = useState<Equipment | null>(null);
  const [maintenanceEq, setMaintenanceEq] = useState<Equipment | null>(null);

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: equipmentService.getAll,
  });
  const { data: catalog = [] } = useQuery({
    queryKey: ['equipment-catalog'],
    queryFn: equipmentService.getCatalog,
  });

  // Fetch full detail (with all maintenance records) when viewing
  const { data: detailFull } = useQuery({
    queryKey: ['equipment', detailEq?.id],
    queryFn: () => equipmentService.getOne(detailEq!.id),
    enabled: !!detailEq,
  });

  const deleteMutation = useMutation({
    mutationFn: equipmentService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] });
      setDetailEq(null);
    },
  });

  const filtered = equipment.filter(e =>
    `${e.name} ${e.brand ?? ''} ${e.category}`.toLowerCase().includes(search.toLowerCase())
  );
  const needsMaintenance = equipment.filter(e =>
    e.nextMaintenance && new Date(e.nextMaintenance) <= new Date()
  );

  useEffect(() => {
    if (openedFromQueryRef.current || equipment.length === 0) return;

    const targetEquipment = equipment.find((item) => {
      if (equipmentIdFromQuery && item.id === equipmentIdFromQuery) return true;
      if (equipmentShortId && item.id.toLowerCase().startsWith(equipmentShortId)) return true;
      return false;
    });

    if (targetEquipment) {
      setDetailEq(targetEquipment);
      openedFromQueryRef.current = true;
    }
  }, [equipmentIdFromQuery, equipmentShortId, equipment]);

  return (
    <ProtectedRoute allowedRoles={[UserRole.GYM_ADMIN, UserRole.TRAINER]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-xl">
                <Dumbbell className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark">Equipamiento</h1>
                <p className="text-sm text-gray-500">{equipment.length} equipos registrados</p>
              </div>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Agregar Equipo
              </Button>
            )}
          </div>

          {/* Maintenance alert */}
          {needsMaintenance.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-800">
                {needsMaintenance.length} equipo(s) requieren mantenimiento:{' '}
                {needsMaintenance.map(e => e.name).join(', ')}
              </p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar equipo..." className="pl-10" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bone border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Equipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Categoría</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Marca</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Último Mant.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Próximo Mant.</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Mantenimientos</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No se encontró equipamiento</td></tr>
                  ) : filtered.map(eq => (
                    <tr key={eq.id} onClick={() => setDetailEq(eq)} className="hover:bg-bone/50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 font-medium text-dark text-sm">{eq.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{categoryLabels[eq.category]}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{eq.brand || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig[eq.status]?.variant}>
                          {statusConfig[eq.status]?.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {eq.lastMaintenance ? new Date(eq.lastMaintenance).toLocaleDateString('es-CR') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        {eq.nextMaintenance ? (
                          <span className={new Date(eq.nextMaintenance) <= new Date() ? 'text-red-500 font-medium' : 'text-gray-600'}>
                            {new Date(eq.nextMaintenance).toLocaleDateString('es-CR')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center hidden lg:table-cell">
                        {(eq as any)._count?.maintenanceRecords ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail modal */}
        <AnimatePresence initial={false}>
          {detailEq && (
            <EquipmentDetailModal
              key={`equipment-detail-${detailEq.id}`}
              equipment={detailFull ?? detailEq}
              highlightMaintenanceId={maintenanceIdFromQuery ?? maintenanceShortId}
              isAdmin={isAdmin}
              onClose={() => setDetailEq(null)}
              onEdit={() => { setEditEq(detailFull ?? detailEq); setDetailEq(null); }}
              onMaintenance={() => { setMaintenanceEq(detailFull ?? detailEq); setDetailEq(null); }}
              onDelete={() => {
                if (confirm('¿Eliminar este equipo?')) deleteMutation.mutate(detailEq.id);
              }}
              onRefresh={() => qc.invalidateQueries({ queryKey: ['equipment', detailEq.id] })}
            />
          )}
        </AnimatePresence>

        {/* Create modal */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Agregar Equipo" size="md">
          <EquipmentForm catalog={catalog}
            onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['equipment'] }); }}
            onCancel={() => setShowCreate(false)} />
        </Modal>

        {/* Edit modal */}
        <Modal open={!!editEq} onClose={() => setEditEq(null)} title="Editar Equipo" size="md">
          {editEq && (
            <EquipmentForm equipment={editEq} catalog={catalog}
              onSuccess={() => { setEditEq(null); qc.invalidateQueries({ queryKey: ['equipment'] }); }}
              onCancel={() => setEditEq(null)} />
          )}
        </Modal>

        {/* Maintenance modal */}
        <Modal open={!!maintenanceEq} onClose={() => setMaintenanceEq(null)} title="Registrar Mantenimiento" size="sm">
          {maintenanceEq && (
            <MaintenanceForm equipment={maintenanceEq}
              onSuccess={() => { setMaintenanceEq(null); qc.invalidateQueries({ queryKey: ['equipment'] }); }}
              onCancel={() => setMaintenanceEq(null)} />
          )}
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ── Equipment detail modal ──────────────────────────────────────────────────
function EquipmentDetailModal({ equipment, highlightMaintenanceId, isAdmin, onClose, onEdit, onMaintenance, onDelete, onRefresh }: {
  equipment: Equipment & { maintenanceRecords?: any[] };
  highlightMaintenanceId?: string | null;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
  onMaintenance: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const records = equipment.maintenanceRecords ?? [];
  const prefersReducedMotion = useReducedMotion();
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);
  const { data: maintenanceUsers = [] } = useQuery({
    queryKey: ['equipment-maintenance-users'],
    queryFn: equipmentService.getMaintenanceUsers,
  });

  useEffect(() => {
    if (!highlightMaintenanceId) return;

    const normalizedRef = highlightMaintenanceId.toLowerCase();
    const targetRecord = records.find((record: any) => {
      const recordId = String(record.id).toLowerCase();
      return recordId === normalizedRef || recordId.startsWith(normalizedRef);
    });

    if (!targetRecord) return;

    setHighlightedRecordId(targetRecord.id);

    const timeoutId = setTimeout(() => {
      setHighlightedRecordId(null);
    }, 3200);

    const scrollId = requestAnimationFrame(() => {
      const node = document.getElementById(`maintenance-record-${targetRecord.id}`);
      node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(scrollId);
    };
  }, [highlightMaintenanceId, records]);

  function isSameDay(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <motion.div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
      />
      <motion.div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[95vh] flex flex-col"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 22, scale: 0.985 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.99 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
      >

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-dark truncate">{equipment.name}</h2>
            {equipment.brand && <p className="text-sm text-gray-500 mt-0.5">{equipment.brand}</p>}
          </div>
          <div className="flex items-center gap-1 ml-4 shrink-0">
            {isAdmin && (
              <button onClick={onDelete}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors" aria-label="Eliminar">
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            )}
            {isAdmin && (
              <button onClick={onEdit}
                className="p-2 rounded-lg hover:bg-bone transition-colors" aria-label="Editar">
                <Pencil className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <button onClick={onClose}
              className="p-2 rounded-lg hover:bg-bone transition-colors" aria-label="Cerrar">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2">
            <InfoTile
              icon={<Tag className="h-4 w-4" />}
              iconClass="text-violet-500"
              label="Categoría"
              value={categoryLabels[equipment.category] ?? equipment.category}
            />
            <InfoTile
              icon={<Activity className="h-4 w-4" />}
              iconClass={
                equipment.status === 'OPERATIONAL' ? 'text-emerald-500' :
                equipment.status === 'MAINTENANCE' ? 'text-amber-500' :
                equipment.status === 'DAMAGED' ? 'text-red-500' : 'text-gray-400'
              }
              label="Estado"
            >
              <Badge variant={statusConfig[equipment.status]?.variant} className="text-xs">
                {statusConfig[equipment.status]?.label}
              </Badge>
            </InfoTile>
            <InfoTile
              icon={<CalendarCheck className="h-4 w-4" />}
              iconClass="text-sky-500"
              label="Último mantenimiento"
              value={equipment.lastMaintenance ? new Date(equipment.lastMaintenance).toLocaleDateString('es-CR') : 'Sin registro'}
            />
            <InfoTile
              icon={<CalendarClock className="h-4 w-4" />}
              iconClass="text-orange-500"
              label="Próximo mantenimiento"
            >
              {equipment.nextMaintenance ? (
                <span className={new Date(equipment.nextMaintenance) <= new Date() ? 'text-red-500 text-sm font-semibold' : 'text-dark text-sm font-semibold'}>
                  {new Date(equipment.nextMaintenance).toLocaleDateString('es-CR')}
                </span>
              ) : <span className="text-sm text-gray-400">—</span>}
            </InfoTile>
            {equipment.purchaseDate && (
              <InfoTile
                icon={<ShoppingCart className="h-4 w-4" />}
                iconClass="text-teal-500"
                label="Fecha de compra"
                value={new Date(equipment.purchaseDate).toLocaleDateString('es-CR')}
              />
            )}
            <InfoTile
              icon={<RefreshCw className="h-4 w-4" />}
              iconClass="text-primary-active"
              label="Frecuencia mant."
              value={`Cada ${equipment.maintenanceFrequencyDays} días`}
            />
          </div>

          {equipment.notes && (
            <div className="bg-bone rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Notas</p>
              <p className="text-sm text-dark">{equipment.notes}</p>
            </div>
          )}

          {/* Maintenance history */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Historial de mantenimientos ({records.length})
            </p>
            {records.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-6 flex items-center justify-center">
                <span className="text-xs text-gray-300">Sin registros de mantenimiento</span>
              </div>
            ) : (
              <div className={records.length > 3 ? 'space-y-2 max-h-[260px] overflow-y-auto pr-1 pl-1 py-1 soft-scroll' : 'space-y-2'}>
                {records.map((r: any) => (
                  <div
                    key={r.id}
                    id={`maintenance-record-${r.id}`}
                  >
                    {editingRecord?.id === r.id ? (
                      <MaintenanceRecordEditForm
                        record={r}
                        users={maintenanceUsers}
                        onSave={() => { setEditingRecord(null); onRefresh(); }}
                        onCancel={() => setEditingRecord(null)}
                      />
                    ) : (
                      <div
                        className={`rounded-xl p-3 space-y-1 transition-all duration-500 ${
                          highlightedRecordId === r.id
                            ? 'bg-primary/10 border border-primary-active/50 shadow-sm'
                            : 'bg-bone border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-dark">
                            {maintenanceTypeLabels[r.type] ?? r.type}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">
                              {new Date(r.date).toLocaleDateString('es-CR')}
                            </span>
                            {isSameDay(r.date) && (
                              <button onClick={() => setEditingRecord(r)}
                                className="p-1 rounded hover:bg-white transition-colors" aria-label="Editar registro">
                                <Pencil className="h-3 w-3 text-gray-400" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">{r.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Por: {r.performedBy}</span>
                          {r.cost && <span className="font-medium text-dark">₡{Number(r.cost).toLocaleString('es-CR')}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-gray-100 shrink-0 flex justify-end">
          {isAdmin && (
            <Button variant="outline" onClick={onMaintenance} className="flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Registrar mantenimiento
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function MaintenanceRecordEditForm({ record, users, onSave, onCancel }: {
  record: any;
  users: Array<{ id: string; firstName: string; lastName: string; email: string; role: string }>;
  onSave: () => void;
  onCancel: () => void;
}) {
  const matchedUser = users.find((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.trim().toLowerCase();
    const performedBy = String(record.performedBy || '').trim().toLowerCase();
    return fullName === performedBy || u.email.trim().toLowerCase() === performedBy;
  });

  const [type, setType]               = useState(record.type);
  const [description, setDescription] = useState(record.description);
  const [cost, setCost]               = useState(record.cost ? String(record.cost) : '');
  const [performedByUserId, setPerformedByUserId] = useState(matchedUser?.id ?? '');
  const [error, setError]             = useState('');

  const mutation = useMutation({
    mutationFn: () => equipmentService.updateMaintenance(record.id, {
      type,
      description,
      cost: cost ? Number(cost) : 0,
      performedByUserId,
    }),
    onSuccess: onSave,
    onError: () => setError('Error al guardar los cambios.'),
  });

  const handleSave = () => {
    setError('');
    if (!performedByUserId) {
      setError('Selecciona el usuario que realizó el mantenimiento.');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="bg-white border border-primary/30 rounded-xl p-3 space-y-2">
      {/* Row 1: type + description */}
      <div className="grid grid-cols-[160px_1fr] gap-2">
        <Select value={type} onChange={e => setType(e.target.value)}>
          <option value="ROUTINE">Rutinario</option>
          <option value="REPAIR">Reparación</option>
          <option value="REPLACEMENT">Reemplazo</option>
        </Select>
        <Input value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Descripción" className="h-10 text-sm" />
      </div>

      {/* Row 2: cost + performedBy + action buttons */}
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
        <Input type="number" min={0} value={cost} onChange={e => setCost(e.target.value)}
          placeholder="Costo (₡)" className="h-9 text-sm" />
        <Select value={performedByUserId} onChange={e => setPerformedByUserId(e.target.value)}>
          <option value="">Seleccionar usuario...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName}
            </option>
          ))}
        </Select>
        <div className="flex gap-1">
          <button type="button" onClick={onCancel}
            className="p-2 rounded-lg border border-gray-200 hover:bg-bone transition-colors" aria-label="Cancelar">
            <X className="h-4 w-4 text-gray-400" />
          </button>
          <button type="button" onClick={handleSave} disabled={mutation.isPending}
            className="p-2 rounded-lg bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50" aria-label="Guardar">
            <Check className="h-4 w-4 text-dark" />
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}

function InfoTile({ icon, iconClass, label, value, children }: {
  icon?: React.ReactNode; iconClass?: string; label: string; value?: string; children?: React.ReactNode;
}) {
  return (
    <div className="bg-bone rounded-xl p-3 flex items-center gap-3">
      {icon && <div className={`shrink-0 ${iconClass}`}>{icon}</div>}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-gray-400 leading-none mb-1">{label}</p>
        {children ?? <p className="text-sm font-semibold text-dark">{value}</p>}
      </div>
    </div>
  );
}
