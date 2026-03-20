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
import { Plus, Search, CreditCard, Users, Trash2 } from 'lucide-react';
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

  const totalActiveUsers = plans.reduce((sum, p) => sum + (p.activeUsers ?? 0), 0);
  const activePlans = plans.filter(p => p.isActive).length;

  return (
    <ProtectedRoute allowedRoles={[UserRole.GYM_ADMIN, UserRole.RECEPTIONIST]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-dark to-gray-800 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-xl">
                  <CreditCard className="h-8 w-8 text-dark" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Planes de Membresía</h1>
                  <p className="text-gray-300 mt-1">
                    {plans.length} plan{plans.length !== 1 ? 'es' : ''} disponible{plans.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowCreate(true)}
                className="hidden sm:flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Plan
              </Button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><CreditCard className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs text-gray-500">Planes activos</p><p className="text-2xl font-bold text-dark">{activePlans}</p></div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg"><Users className="h-5 w-5 text-emerald-600" /></div>
              <div><p className="text-xs text-gray-500">Usuarios activos</p><p className="text-2xl font-bold text-dark">{totalActiveUsers}</p></div>
            </div>
          </div>

          {/* Filters + mobile create button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar membresía..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1 bg-bone p-1 rounded-xl overflow-x-auto">
              {[['', 'Todas'], ['MONTHLY', 'Mensual'], ['QUARTERLY', 'Trimestral'], ['ANNUAL', 'Anual']].map(([val, label]) => (
                <button key={val} onClick={() => setTypeFilter(val)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${typeFilter === val ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'}`}>
                  {label}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              className="sm:hidden w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Plan
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setEditPlan(plan)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left flex flex-col"
                >
                  {/* Header with title and badges aligned right */}
                  <div className="p-4 flex items-start justify-between gap-3">
                    <h3 className="font-bold text-dark text-base leading-tight flex-1">{plan.name}</h3>
                    
                    {/* Badges + delete icon aligned in corner */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={typeVariant[plan.type]} className="text-xs whitespace-nowrap">
                        {typeLabels[plan.type]}
                      </Badge>
                      <Badge variant={plan.isActive ? 'success' : 'secondary'} className="text-xs whitespace-nowrap">
                        {plan.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm('¿Eliminar esta membresía?')) deleteMutation.mutate(plan.id);
                        }}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Eliminar membresía"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description - full width */}
                  {plan.description && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-gray-600 leading-relaxed">{plan.description}</p>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-gray-100"></div>

                  {/* Footer content */}
                  <div className="p-4">
                    {/* Compact price + active users */}
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Precio ({typeLabels[plan.type]})</p>
                          <p className="text-3xl font-bold text-green-700">
                            ₡{Number(plan.price).toLocaleString('es-CR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2 border border-green-200">
                          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-green-100">
                            <Users className="h-4 w-4 text-green-700" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600 font-medium leading-none">Usuarios activos</p>
                            <p className="text-lg font-bold text-green-700 leading-tight mt-1">{plan.activeUsers ?? 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </button>
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
