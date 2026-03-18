'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { staffService } from '@/services/staff.service';
import { UserRole } from '@/types/auth';
import { StaffMember } from '@/types/gym';
import { Plus, Search, Edit2, Trash2, Users, KeyRound, Shield, UserCheck } from 'lucide-react';
import { StaffForm } from '@/components/staff/staff-form';
import { ResetPasswordForm } from '@/components/staff/reset-password-form';

const roleConfig: Record<string, { label: string; variant: any; icon: any }> = {
  TRAINER: { label: 'Entrenador', variant: 'info', icon: UserCheck },
  RECEPTIONIST: { label: 'Recepcionista', variant: 'secondary', icon: Shield },
};

export default function StaffPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [resetPasswordStaff, setResetPasswordStaff] = useState<StaffMember | null>(null);

  const { data: staff = [], isLoading } = useQuery({ queryKey: ['staff'], queryFn: staffService.getAll });

  const deleteMutation = useMutation({
    mutationFn: staffService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });

  const filtered = staff.filter(s =>
    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="grid grid-cols-2 gap-4 max-w-sm">
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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bone border-b border-gray-100">
                  <tr>{['Miembro', 'Email', 'Rol', 'Miembro desde', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No se encontraron miembros</td></tr>
                  : filtered.map(s => {
                    const RoleIcon = roleConfig[s.role]?.icon;
                    return (
                      <tr key={s.id} className="hover:bg-bone/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                              {s.firstName[0]}{s.lastName[0]}
                            </div>
                            <span className="font-medium text-dark">{s.firstName} {s.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {RoleIcon && <RoleIcon className="h-3.5 w-3.5 text-gray-500" />}
                            <Badge variant={roleConfig[s.role]?.variant}>{roleConfig[s.role]?.label}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(s.createdAt).toLocaleDateString('es-CR')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setResetPasswordStaff(s)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600" title="Resetear contraseña"><KeyRound className="h-4 w-4" /></button>
                            <button onClick={() => setEditStaff(s)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => { if (confirm(`¿Eliminar a ${s.firstName}?`)) deleteMutation.mutate(s.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}
