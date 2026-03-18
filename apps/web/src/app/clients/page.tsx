'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { clientsService } from '@/services/clients.service';
import { UserRole } from '@/types/auth';
import { Client } from '@/types/gym';
import { Plus, Search, Eye, Edit2, Trash2, Users } from 'lucide-react';
import { ClientForm } from '@/components/clients/client-form';
import { ClientFullForm } from '@/components/clients/client-full-form';
import { ClientDetail } from '@/components/clients/client-detail';

export default function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [viewClient, setViewClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: clientsService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });

  const filtered = clients.filter(c =>
    `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const map: Record<string, any> = { ACTIVE: 'success', SUSPENDED: 'warning', INACTIVE: 'danger' };
    const labels: Record<string, string> = { ACTIVE: 'Activo', SUSPENDED: 'Suspendido', INACTIVE: 'Inactivo' };
    return <Badge variant={map[status]}>{labels[status]}</Badge>;
  };

  const membershipBadge = (client: Client) => {
    const m = client.memberships?.[0];
    if (!m) return <Badge variant="secondary">Sin membresía</Badge>;
    const map: Record<string, any> = { ACTIVE: 'success', EXPIRING_SOON: 'warning', EXPIRED: 'danger', CANCELLED: 'secondary' };
    const labels: Record<string, string> = { ACTIVE: 'Activa', EXPIRING_SOON: 'Por vencer', EXPIRED: 'Vencida', CANCELLED: 'Cancelada' };
    return <Badge variant={map[m.status]}>{labels[m.status]}</Badge>;
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.GYM_ADMIN, UserRole.TRAINER, UserRole.RECEPTIONIST]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><Users className="h-6 w-6 text-primary" /></div>
              <div>
                <h1 className="text-2xl font-bold text-dark">Clientes</h1>
                <p className="text-sm text-gray-500">{clients.length} clientes registrados</p>
              </div>
            </div>
            <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Cliente
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar por nombre o email..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bone border-b border-gray-100">
                  <tr>
                    {['Cliente', 'Email', 'Teléfono', 'Membresía', 'Vence', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No se encontraron clientes</td></tr>
                  ) : filtered.map(client => (
                    <tr key={client.id} className="hover:bg-bone/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-dark">
                            {client.firstName[0]}{client.lastName[0]}
                          </div>
                          <span className="font-medium text-dark">{client.firstName} {client.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{client.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{client.phone || '—'}</td>
                      <td className="px-4 py-3">{membershipBadge(client)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {client.memberships?.[0] ? new Date(client.memberships[0].endDate).toLocaleDateString('es-CR') : '—'}
                      </td>
                      <td className="px-4 py-3">{statusBadge(client.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewClient(client)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Eye className="h-4 w-4" /></button>
                          <button onClick={() => setEditClient(client)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => { if (confirm('¿Eliminar cliente?')) deleteMutation.mutate(client.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modals */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Cliente" size="lg">
          <ClientFullForm onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['clients'] }); }} onCancel={() => setShowCreate(false)} />
        </Modal>

        <Modal open={!!editClient} onClose={() => setEditClient(null)} title="Editar Cliente" size="lg">
          {editClient && <ClientForm client={editClient} onSuccess={() => { setEditClient(null); qc.invalidateQueries({ queryKey: ['clients'] }); }} onCancel={() => setEditClient(null)} />}
        </Modal>

        <Modal open={!!viewClient} onClose={() => setViewClient(null)} title="Detalle del Cliente" size="xl">
          {viewClient && <ClientDetail clientId={viewClient.id} />}
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
