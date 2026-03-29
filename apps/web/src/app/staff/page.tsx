'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { staffService } from '@/services/staff.service';
import { UserRole } from '@/types/auth';
import { StaffMember } from '@/types/gym';
import { DIFFICULTY_LABELS } from '@/types/routines';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  KeyRound,
  Shield,
  UserCheck,
  Crown,
  Loader2,
  ClipboardList,
  UsersRound,
  Wrench,
  CalendarDays,
  ArrowUpRight,
} from 'lucide-react';
import { StaffForm } from '@/components/staff/staff-form';
import { ResetPasswordForm } from '@/components/staff/reset-password-form';

const roleConfig: Record<string, { label: string; variant: any; icon: any }> = {
  GYM_ADMIN: { label: 'Gym Admin', variant: 'warning', icon: Crown },
  TRAINER: { label: 'Entrenador', variant: 'info', icon: UserCheck },
  RECEPTIONIST: { label: 'Recepcionista', variant: 'secondary', icon: Shield },
};

const maintenanceTypeLabel: Record<string, string> = {
  ROUTINE: 'Rutinario',
  REPAIR: 'Reparación',
  REPLACEMENT: 'Reemplazo',
};

function toSlugPart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
}

function buildShortRef(prefix: string, label: string, id: string) {
  const base = toSlugPart(label) || prefix;
  return `${base}-${prefix}-${id.slice(0, 8)}`;
}

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

export default function StaffPage() {
  const qc = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [resetPasswordStaff, setResetPasswordStaff] = useState<StaffMember | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const { data: staff = [], isLoading } = useQuery({ queryKey: ['staff'], queryFn: staffService.getAll });

  const deleteMutation = useMutation({
    mutationFn: staffService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });

  const { data: selectedStaffDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['staff', selectedStaffId],
    queryFn: () => staffService.getOne(selectedStaffId!),
    enabled: !!selectedStaffId,
  });

  const filtered = staff.filter(s =>
    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const admins = staff.filter(s => s.role === 'GYM_ADMIN').length;
  const trainers = staff.filter(s => s.role === 'TRAINER').length;
  const receptionists = staff.filter(s => s.role === 'RECEPTIONIST').length;

  return (
    <ProtectedRoute allowedRoles={[UserRole.GYM_ADMIN]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl"><Users className="h-6 w-6 text-indigo-600" /></div>
              <div><h1 className="text-2xl font-bold text-dark">Staff</h1><p className="text-sm text-gray-500">{staff.length} miembros del equipo</p></div>
            </div>
            <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2"><Plus className="h-4 w-4" />Nuevo Miembro</Button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg"><Crown className="h-5 w-5 text-yellow-600" /></div>
              <div><p className="text-xs text-gray-500">Gym Admin</p><p className="text-2xl font-bold text-dark">{admins}</p></div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg"><UserCheck className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-xs text-gray-500">Entrenadores</p><p className="text-2xl font-bold text-dark">{trainers}</p></div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg"><Shield className="h-5 w-5 text-purple-600" /></div>
              <div><p className="text-xs text-gray-500">Recepcionistas</p><p className="text-2xl font-bold text-dark">{receptionists}</p></div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar por nombre o email..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            animate={
              selectedStaffId
                ? { opacity: 0.88, scale: 0.995 }
                : { opacity: 1, scale: 1 }
            }
            transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bone border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Miembro</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actividad</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No se encontraron miembros</td></tr>
                  : filtered.map((s, index) => {
                    const RoleIcon = roleConfig[s.role]?.icon;
                    return (
                      <motion.tr
                        key={s.id}
                        className="hover:bg-bone/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedStaffId(s.id)}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: Math.min(index * 0.02, 0.12),
                          ease: 'easeOut',
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                              {s.firstName[0]}{s.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-dark">{s.firstName} {s.lastName}</p>
                              <p className="text-xs text-gray-500">Miembro desde {new Date(s.createdAt).toLocaleDateString('es-CR')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-600">{s.email}</td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {RoleIcon && <RoleIcon className="h-3.5 w-3.5 text-gray-500" />}
                            <Badge variant={roleConfig[s.role]?.variant}>{roleConfig[s.role]?.label}</Badge>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {s.role === 'TRAINER' || s.role === 'GYM_ADMIN' ? (
                              <>
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">
                                  <span className="font-semibold">Rutinas</span>
                                  <span className="font-bold">{s.metrics?.routinesCreated ?? 0}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-cyan-800">
                                  <span className="font-semibold">Clientes</span>
                                  <span className="font-bold">{s.metrics?.activeAssignedClients ?? 0}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
                                  <span className="font-semibold">Mantenimientos</span>
                                  <span className="font-bold">{s.metrics?.maintenancePerformed ?? 0}</span>
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-purple-800">
                                  <span className="font-semibold">Clientes añadidos</span>
                                  <span className="font-bold">{s.metrics?.clientsCreated ?? 0}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
                                  <span className="font-semibold">Mantenimientos</span>
                                  <span className="font-bold">{s.metrics?.maintenancePerformed ?? 0}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setResetPasswordStaff(s); }} className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600" title="Resetear contraseña"><KeyRound className="h-4 w-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setEditStaff(s); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar a ${s.firstName}?`)) deleteMutation.mutate(s.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Miembro del Staff" size="md">
          <StaffForm onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['staff'] }); }} onCancel={() => setShowCreate(false)} />
        </Modal>
        <Modal open={!!editStaff} onClose={() => setEditStaff(null)} title="Editar Miembro" size="md">
          {editStaff && <StaffForm staff={editStaff} onSuccess={() => { setEditStaff(null); qc.invalidateQueries({ queryKey: ['staff'] }); }} onCancel={() => setEditStaff(null)} />}
        </Modal>
        <Modal open={!!resetPasswordStaff} onClose={() => setResetPasswordStaff(null)} title="Resetear Contraseña" size="sm">
          {resetPasswordStaff && <ResetPasswordForm staff={resetPasswordStaff} onSuccess={() => setResetPasswordStaff(null)} onCancel={() => setResetPasswordStaff(null)} />}
        </Modal>

        <Modal open={!!selectedStaffId} onClose={() => setSelectedStaffId(null)} title="Detalle del miembro" size="lg">
          {!selectedStaffDetail || isLoadingDetail ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-5 sm:p-6 space-y-6">
              <div className="rounded-2xl bg-gradient-to-r from-dark to-gray-800 p-4 sm:p-5 text-white">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-full bg-primary text-dark flex items-center justify-center text-sm font-bold shrink-0">
                      {selectedStaffDetail.firstName[0]}{selectedStaffDetail.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold leading-tight truncate">
                        {selectedStaffDetail.firstName} {selectedStaffDetail.lastName}
                      </h3>
                      <p className="text-sm text-gray-300 truncate">{selectedStaffDetail.email}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col sm:text-right items-center sm:items-end gap-2 sm:gap-1 shrink-0">
                    <Badge variant={roleConfig[selectedStaffDetail.role]?.variant}>
                      {roleConfig[selectedStaffDetail.role]?.label || selectedStaffDetail.role}
                    </Badge>
                    <p className="text-xs text-gray-300">
                      Miembro desde {new Date(selectedStaffDetail.createdAt).toLocaleDateString('es-CR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-white/70 p-1.5">
                      <ClipboardList className="h-4 w-4 text-blue-700" />
                    </div>
                    <p className="text-xs text-blue-700 font-semibold">Rutinas creadas</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-blue-900">{selectedStaffDetail.metrics?.routinesCreated ?? 0}</p>
                </div>
                <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-white/70 p-1.5">
                      <UsersRound className="h-4 w-4 text-cyan-700" />
                    </div>
                    <p className="text-xs text-cyan-700 font-semibold">Clientes activos</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-cyan-900">{selectedStaffDetail.metrics?.activeAssignedClients ?? 0}</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-white/70 p-1.5">
                      <Wrench className="h-4 w-4 text-amber-700" />
                    </div>
                    <p className="text-xs text-amber-700 font-semibold">Mantenimientos</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-amber-900">{selectedStaffDetail.metrics?.maintenancePerformed ?? 0}</p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedStaffDetail.activity?.routines?.length ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-dark flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-primary-active" />
                        Rutinas creadas
                      </h4>
                      <Link href="/routines" className="text-sm font-semibold text-primary-active hover:underline">
                        Ir a rutinas
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {selectedStaffDetail.activity.routines.map((routine) => (
                        <div key={routine.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
                          <div>
                            <p className="font-medium text-dark flex items-center gap-2">
                              <span>{routine.name}</span>
                              <span className="inline-flex items-center rounded-full bg-bone px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                                {DIFFICULTY_LABELS[routine.difficulty] || routine.difficulty}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-800">
                                {routine._count?.assignments ?? 0} clientes
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {new Date(routine.createdAt).toLocaleDateString('es-CR')}
                              </span>
                            </p>
                          </div>
                          <Link
                            href={`/routines?routine=${buildShortRef('r', routine.name, routine.id)}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-active hover:underline"
                          >
                                    Ver detalles
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="space-y-3">
                {selectedStaffDetail.activity?.maintenance?.length ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-dark flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-primary-active" />
                        Mantenimientos recientes
                      </h4>
                      <Link href="/equipment" className="text-sm font-semibold text-primary-active hover:underline">
                        Ir a equipamiento
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {selectedStaffDetail.activity.maintenance.map((record) => (
                        <div key={record.id} className="group rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm hover:border-gray-200 hover:shadow transition-all">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-amber-100 flex items-center justify-center">
                              <Wrench className="h-3.5 w-3.5 text-amber-700" />
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex items-center gap-2">
                                  <p className="font-medium text-sm text-dark truncate">{record.equipment.name}</p>
                                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 shrink-0">
                                    {maintenanceTypeLabel[record.type] || record.type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    {new Date(record.date).toLocaleDateString('es-CR')}
                                  </span>
                                  <Link
                                    href={`/equipment?equipment=${buildShortRef('e', record.equipment.name, record.equipment.id)}&maintenance=${buildShortRef('m', 'registro', record.id)}`}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-active hover:underline"
                                  >
                                    Ver detalles
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                  </Link>
                                </div>
                              </div>

                              <div className="flex items-start justify-between gap-3">
                                <p className="text-xs text-gray-600 leading-relaxed flex-1">{record.description}</p>
                                <span className="text-sm font-bold text-dark shrink-0">
                                  {record.cost ? `₡${Number(record.cost).toLocaleString('es-CR')}` : 'Sin costo'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              {selectedStaffDetail.activity?.clients?.length ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-dark flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary-active" />
                      Clientes creados
                    </h4>
                    <Link href="/clients" className="text-sm font-semibold text-primary-active hover:underline">
                      Ir a clientes
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedStaffDetail.activity.clients.map((client) => (
                      <Link
                        key={client.id}
                        href={`/clients?client=${buildShortRef('c', `${client.firstName} ${client.lastName}`, client.id)}`}
                        className="bg-dark rounded-xl px-3 py-2 flex gap-2 items-center hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-sm font-bold text-dark shrink-0">
                          {client.firstName[0]}{client.lastName[0]}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-white text-sm font-semibold truncate leading-tight">
                              {client.firstName.split(' ')[0]} {client.lastName.split(' ')[0]}
                            </p>
                            <p className="text-xs text-gray-500 shrink-0 leading-tight">
                              {new Date(client.createdAt).toLocaleDateString('es-CR')}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-x-0.5 gap-y-0 text-xs">
                            <span className="text-gray-400">Peso <span className="text-white font-medium">{client.weight}kg</span></span>
                            <span className="text-gray-400">Altura <span className="text-white font-medium">{client.height}cm</span></span>
                            <span className="text-gray-400">IMC <span className="text-white font-medium">{client.bmi ? Number(client.bmi).toFixed(1) : '—'}</span></span>
                            <span className="text-gray-400">Edad <span className="text-white font-medium">{calcAge(client.dateOfBirth)}a</span></span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Modal>

      </DashboardLayout>
    </ProtectedRoute>
  );
}
