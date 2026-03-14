'use client';

import { useState } from 'react';
import { Routine } from '@/types/routines';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, UserPlus, Search, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routinesService } from '@/services/routines.service';
import { api } from '@/lib/api';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AssignRoutineModalProps {
  routine: Routine;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignRoutineModal({ routine, onClose, onSuccess }: AssignRoutineModalProps) {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const res = await api.get('/clients');
      return res.data?.data || res.data || [];
    },
  });

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      routinesService.assign(routine.id, {
        clientId: selectedClient!.id,
        startDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      onSuccess();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-dark">Asignar rutina</h2>
            <p className="text-sm text-gray-500 mt-0.5">{routine.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bone transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Client search */}
          <div className="space-y-2">
            <Label>Seleccionar cliente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              {clientsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No se encontraron clientes</p>
              ) : (
                filtered.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-0 ${
                      selectedClient?.id === client.id
                        ? 'bg-primary/10 border-l-2 border-l-primary'
                        : 'hover:bg-bone'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shrink-0">
                      <span className="text-dark font-bold text-xs">
                        {client.firstName[0]}{client.lastName[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark truncate">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{client.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Start date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Fecha de inicio</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Error */}
          {assignMutation.isError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              Error al asignar la rutina. Intenta de nuevo.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={!selectedClient || assignMutation.isPending}
            className="flex-1"
          >
            {assignMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Asignar
          </Button>
        </div>
      </div>
    </div>
  );
}
