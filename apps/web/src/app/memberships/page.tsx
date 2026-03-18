'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { membershipPlansService } from '@/services/membership-plans.service';
import { UserRole } from '@/types/auth';
import { Plus, Search, CreditCard, Trash2 } from 'lucide-react';
import { MembershipPlanForm } from '@/components/memberships/membership-plan-form';

const typeLabels: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual' };
const typeVariant: Record<string, any>   = { MONTHLY: 'secondary', QUARTERLY: 'warning', ANNUAL: 'success' };

export default function MembershipsPage() {
  const qc = useQueryClient();
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editPlan, setEditPlan]     = useState<any>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: membershipPlansService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: membershipPlansService.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['membership-plans'] }),
  });

  const filtered = plans.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter ? p.type === typeFilter : true;
    return matchSearch && matchType;
  });

  return (
    <ProtectedRoute allowedRoles={[UserRole.GYM_ADMIN, UserRole.RECEPTIONIST]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark">Membresías</h1>
                <p className="text-sm text-gray-500">{plans.length} planes disponibles</p>
              </div>
            </div>
            <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nueva Membresía
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar membresía..."
                className="pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-bone p-1 rounded-xl">
              {[['', 'Todas'], ['MONTHLY', 'Mensual'], ['QUARTERLY', 'Trimestral'], ['ANNUAL', 'Anual']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setTypeFilter(val)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    typeFilter === val ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Plans grid */}
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No hay membresías</p>
              <p className="text-sm mt-1">Crea una para poder asignarla a los clientes</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setEditPlan(plan)}
                  className={`bg-white rounded-2xl border-2 p-5 space-y-3 transition-all cursor-pointer hover:border-primary/30 hover:shadow-md ${
                    plan.isActive ? 'border-gray-100' : 'border-gray-100 opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-dark truncate">{plan.name}</p>
                      {plan.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{plan.description}</p>
                      )}
                    </div>
                    <Badge variant={typeVariant[plan.type]} className="shrink-0">
                      {typeLabels[plan.type]}
                    </Badge>
                  </div>

                  <p className="text-2xl font-bold text-dark">
                    ₡{Number(plan.price).toLocaleString('es-CR')}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                        {plan.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {plan.activeUsers ?? 0} usuario{(plan.activeUsers ?? 0) !== 1 ? 's' : ''} activo{(plan.activeUsers ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); if (confirm('¿Eliminar esta membresía?')) deleteMutation.mutate(plan.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal
          open={showCreate || !!editPlan}
          onClose={() => { setShowCreate(false); setEditPlan(null); }}
          title={editPlan ? 'Editar Membresía' : 'Nueva Membresía'}
          size="sm"
        >
          <MembershipPlanForm
            plan={editPlan}
            onSuccess={() => {
              setShowCreate(false);
              setEditPlan(null);
              qc.invalidateQueries({ queryKey: ['membership-plans'] });
            }}
            onCancel={() => { setShowCreate(false); setEditPlan(null); }}
          />
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
