'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { RoutineCard } from '@/components/routines/routine-card';
import { RoutineFiltersBar } from '@/components/routines/routine-filters';
import { RoutineDetailModal } from '@/components/routines/routine-detail-modal';
import { RoutineFormModal } from '@/components/routines/routine-form-modal';
import { AssignRoutineModal } from '@/components/routines/assign-routine-modal';
import { DeleteRoutineModal } from '@/components/routines/delete-routine-modal';
import { routinesService, RoutineFilters } from '@/services/routines.service';
import { Routine } from '@/types/routines';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/contexts/auth.context';
import { Plus, Dumbbell, Loader2 } from 'lucide-react';

type ModalState =
  | { type: 'none' }
  | { type: 'view'; routine: Routine }
  | { type: 'create' }
  | { type: 'edit'; routine: Routine }
  | { type: 'assign'; routine: Routine }
  | { type: 'delete'; routine: Routine };

export default function RoutinesPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<RoutineFilters>({});
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const canEdit = user?.role === UserRole.GYM_ADMIN || user?.role === UserRole.TRAINER;

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['routines', filters],
    queryFn: () => routinesService.getAll(filters),
  });

  const closeModal = () => setModal({ type: 'none' });

  return (
    <ProtectedRoute allowedRoles={[UserRole.GYM_ADMIN, UserRole.TRAINER, UserRole.RECEPTIONIST]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          {/* Page header */}
          <div className="bg-gradient-to-r from-dark to-gray-800 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-xl">
                  <Dumbbell className="h-8 w-8 text-dark" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Biblioteca de Rutinas</h1>
                  <p className="text-gray-300 mt-1">
                    {routines.length} rutina{routines.length !== 1 ? 's' : ''} disponible{routines.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {canEdit && (
                <Button
                  onClick={() => setModal({ type: 'create' })}
                  className="hidden sm:flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nueva rutina
                </Button>
              )}
            </div>
          </div>

          {/* Filters + mobile create button */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 w-full">
              <RoutineFiltersBar filters={filters} onChange={setFilters} />
            </div>
            {canEdit && (
              <Button
                onClick={() => setModal({ type: 'create' })}
                className="sm:hidden w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva rutina
              </Button>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : routines.length === 0 ? (
            <EmptyState canEdit={canEdit} onCreate={() => setModal({ type: 'create' })} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {routines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  canEdit={canEdit}
                  onView={(r) => setModal({ type: 'view', routine: r })}
                  onAssign={(r) => setModal({ type: 'assign', routine: r })}
                  onEdit={(r) => setModal({ type: 'edit', routine: r })}
                  onDelete={(r) => setModal({ type: 'delete', routine: r })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {modal.type === 'view' && (
          <RoutineDetailModal
            routine={modal.routine}
            onClose={closeModal}
            onAssign={() => setModal({ type: 'assign', routine: modal.routine })}
          />
        )}
        {(modal.type === 'create' || modal.type === 'edit') && (
          <RoutineFormModal
            routine={modal.type === 'edit' ? modal.routine : undefined}
            onClose={closeModal}
            onSuccess={closeModal}
          />
        )}
        {modal.type === 'assign' && (
          <AssignRoutineModal
            routine={modal.routine}
            onClose={closeModal}
            onSuccess={closeModal}
          />
        )}
        {modal.type === 'delete' && (
          <DeleteRoutineModal
            routine={modal.routine}
            onClose={closeModal}
            onSuccess={closeModal}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function EmptyState({ canEdit, onCreate }: { canEdit: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-5 bg-bone rounded-full mb-4">
        <Dumbbell className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-dark mb-2">No hay rutinas todavía</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        {canEdit
          ? 'Crea tu primera rutina de entrenamiento para asignarla a tus clientes.'
          : 'No hay rutinas disponibles en este gimnasio.'}
      </p>
      {canEdit && (
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Crear primera rutina
        </Button>
      )}
    </div>
  );
}
