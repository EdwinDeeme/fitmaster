'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { membershipsService } from '@/services/memberships.service';
import { clientsService } from '@/services/clients.service';
import { UserRole } from '@/types/auth';
import { Membership } from '@/types/gym';
import { Plus, Search, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import { MembershipForm } from '@/components/memberships/membership-form';

const statusConfig: Record<string, { label: string; variant: any }> = {
  ACTIVE: { label: 'Activa', variant: 'success' },
  EXPIRING_SOON: { label: 'Por vencer', variant: 'warning' },
  EXPIRED: { label: 'Vencida', variant: 'danger' },
  CANCELLED: { label: 'Cancelada', variant: 'secondary' },
};
const typeLabels: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual' };

export default function MembershipsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: memberships = [], isLoading } = useQuery({ queryKey: ['memberships'], queryFn: membershipsService.getAll });
  const { data: stats } = useQuery({ queryKey: ['memberships-stats'], queryFn: membershipsService.getStats });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientsService.getAll });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => membershipsService.updateStatus(id, 'CANCELLED'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['memberships'] }); qc.invalidateQueries({ queryKey: ['memberships-stats'] }); },
  });

  const filtered = memberships.filter(m => {
    const name = `${m.client?.firstName} ${m.client?.lastName} ${m.client?.email}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <ProtectedRoute allowedRoles={[UserRole.GYM_ADMIN, UserRole.RECEPTIONIST]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl"><CreditCard className="h-6 w-6 text-blue-600" /></div>
              <div>
                <h1 className="text-2xl font-bold text-dark">Membresías</h1>
                <p className="text-sm text-gray-500">{memberships.length} membresías registradas</p>
              </div>
            </div>
            <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nueva Membresía
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Activas', value: stats?.active ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Por vencer', value: stats?.expiringSoon ?? 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Vencidas', value: stats?.expired ?? 0, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
              { label: 'Total', value: stats?.total ?? 0, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
                  <div><p className="text-xs text-gray-500">{label}</p><p className="text-2xl font-bold text-dark">{value}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar por cliente..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bone border-b border-gray-100">
                  <tr>
                    {['Cliente', 'Tipo', 'Inicio', 'Vence', 'Precio', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No se encontraron membresías</td></tr>
                  ) : filtered.map(m => (
                    <tr key={m.id} className="hover:bg-bone/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-dark">{m.client?.firstName} {m.client?.lastName}</p>
                        <p className="text-xs text-gray-500">{m.client?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{typeLabels[m.type]}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(m.startDate).toLocaleDateString('es-CR')}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(m.endDate).toLocaleDateString('es-CR')}</td>
                      <td className="px-4 py-3 text-sm font-medium">₡{Number(m.price).toLocaleString('es-CR')}</td>
                      <td className="px-4 py-3"><Badge variant={statusConfig[m.status]?.variant}>{statusConfig[m.status]?.label}</Badge></td>
                      <td className="px-4 py-3">
                        {m.status !== 'CANCELLED' && m.status !== 'EXPIRED' && (
                          <button onClick={() => { if (confirm('¿Cancelar membresía?')) cancelMutation.mutate(m.id); }} className="text-xs text-red-500 hover:underline">Cancelar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva Membresía" size="md">
          <MembershipForm clients={clients} onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['memberships'] }); qc.invalidateQueries({ queryKey: ['memberships-stats'] }); }} onCancel={() => setShowCreate(false)} />
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
