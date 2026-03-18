'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { equipmentService } from '@/services/equipment.service';
import { Equipment } from '@/types/gym';

interface CatalogItem { name: string; category: string; maintenanceFrequencyDays: number; }
interface Props { equipment?: Equipment; catalog: CatalogItem[]; onSuccess: () => void; onCancel: () => void; }

export function EquipmentForm({ equipment, catalog, onSuccess, onCancel }: Props) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: equipment ?? { maintenanceFrequencyDays: 30 },
  });
  const [useCatalog, setUseCatalog] = useState(!equipment);

  const mutation = useMutation({
    mutationFn: (data: any) => equipment ? equipmentService.update(equipment.id, data) : equipmentService.create(data),
    onSuccess,
  });

  const handleCatalogSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const item = catalog.find(c => c.name === e.target.value);
    if (item) {
      setValue('name', item.name);
      setValue('category', item.category);
      setValue('maintenanceFrequencyDays', item.maintenanceFrequencyDays);
    }
  };

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
      {!equipment && (
        <div className="space-y-1">
          <Label>Seleccionar del Catálogo (opcional)</Label>
          <Select onChange={handleCatalogSelect}>
            <option value="">— Seleccionar equipo predefinido —</option>
            {['CARDIO', 'STRENGTH', 'FREE_WEIGHTS', 'FUNCTIONAL', 'ACCESSORIES'].map(cat => (
              <optgroup key={cat} label={cat === 'FREE_WEIGHTS' ? 'Pesas Libres' : cat === 'CARDIO' ? 'Cardio' : cat === 'STRENGTH' ? 'Fuerza' : cat === 'FUNCTIONAL' ? 'Funcional' : 'Accesorios'}>
                {catalog.filter(c => c.category === cat).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </optgroup>
            ))}
          </Select>
        </div>
      )}
      <div className="space-y-1">
        <Label>Nombre del Equipo</Label>
        <Input {...register('name', { required: true })} placeholder="Ej: Press de Banca" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Categoría</Label>
          <Select {...register('category', { required: true })}>
            <option value="">Seleccionar...</option>
            <option value="CARDIO">Cardio</option>
            <option value="STRENGTH">Fuerza</option>
            <option value="FREE_WEIGHTS">Pesas Libres</option>
            <option value="FUNCTIONAL">Funcional</option>
            <option value="ACCESSORIES">Accesorios</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Marca</Label>
          <Input {...register('brand')} placeholder="Ej: Life Fitness" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Fecha de Compra</Label>
          <Input {...register('purchaseDate')} type="date" />
        </div>
        <div className="space-y-1">
          <Label>Frecuencia Mantenimiento (días)</Label>
          <Input {...register('maintenanceFrequencyDays', { required: true, valueAsNumber: true })} type="number" min={1} />
        </div>
      </div>
      {equipment && (
        <div className="space-y-1">
          <Label>Estado</Label>
          <Select {...register('status')}>
            <option value="OPERATIONAL">Operativo</option>
            <option value="MAINTENANCE">En mantenimiento</option>
            <option value="DAMAGED">Dañado</option>
            <option value="OUT_OF_SERVICE">Fuera de servicio</option>
          </Select>
        </div>
      )}
      {mutation.isError && <p className="text-sm text-red-500">Error al guardar equipo.</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : equipment ? 'Actualizar' : 'Agregar Equipo'}</Button>
      </div>
    </form>
  );
}
