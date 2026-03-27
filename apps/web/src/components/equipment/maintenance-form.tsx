'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { equipmentService } from '@/services/equipment.service';
import { Equipment } from '@/types/gym';

interface Props { equipment: Equipment; onSuccess: () => void; onCancel: () => void; }

interface MaintenanceUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const roleLabel: Record<string, string> = {
  GYM_ADMIN: 'Gym Admin',
  TRAINER: 'Entrenador',
  RECEPTIONIST: 'Recepcionista',
  CLIENT: 'Cliente',
};

export function MaintenanceForm({ equipment, onSuccess, onCancel }: Props) {
  const [type, setType]               = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost]               = useState('');
  const [performedByUserId, setPerformedByUserId] = useState('');
  const [error, setError]             = useState('');

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<MaintenanceUser[]>({
    queryKey: ['equipment-maintenance-users'],
    queryFn: equipmentService.getMaintenanceUsers,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => equipmentService.addMaintenance(equipment.id, data),
    onSuccess,
    onError: () => setError('Error al registrar el mantenimiento.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!type) return setError('Selecciona el tipo de mantenimiento');
    if (!description.trim()) return setError('La descripción es requerida');
    if (!performedByUserId) return setError('Selecciona quién realizó el mantenimiento');

    mutation.mutate({
      type,
      description: description.trim(),
      cost: cost ? Number(cost) : undefined,
      performedByUserId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="bg-bone rounded-xl p-3">
        <p className="text-xs text-gray-500">Equipo</p>
        <p className="font-semibold text-dark">{equipment.name}</p>
      </div>

      <div className="space-y-1.5">
        <Label>Tipo de mantenimiento *</Label>
        <Select value={type} onChange={e => setType(e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="ROUTINE">Rutinario</option>
          <option value="REPAIR">Reparación</option>
          <option value="REPLACEMENT">Reemplazo de pieza</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Descripción *</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Describe el mantenimiento realizado..." rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Costo (₡)</Label>
          <Input type="number" min={0} value={cost} onChange={e => setCost(e.target.value)} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label>Realizado por *</Label>
          <Select value={performedByUserId} onChange={e => setPerformedByUserId(e.target.value)} disabled={isLoadingUsers}>
            <option value="">{isLoadingUsers ? 'Cargando usuarios...' : 'Seleccionar usuario...'}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} · {roleLabel[user.role] || user.role}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : 'Registrar'}
        </Button>
      </div>
    </form>
  );
}
