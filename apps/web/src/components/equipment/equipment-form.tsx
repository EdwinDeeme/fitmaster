'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { equipmentService } from '@/services/equipment.service';
import { Equipment } from '@/types/gym';
import { Search } from 'lucide-react';

interface CatalogItem { name: string; category: string; maintenanceFrequencyDays: number; }
interface Props { equipment?: Equipment; catalog: CatalogItem[]; onSuccess: () => void; onCancel: () => void; }

const CATEGORY_LABELS: Record<string, string> = {
  CARDIO: 'Cardio', STRENGTH: 'Fuerza', FREE_WEIGHTS: 'Pesas Libres',
  FUNCTIONAL: 'Funcional', ACCESSORIES: 'Accesorios',
};
const CATEGORIES = ['CARDIO', 'STRENGTH', 'FREE_WEIGHTS', 'FUNCTIONAL', 'ACCESSORIES'];

export function EquipmentForm({ equipment, catalog, onSuccess, onCancel }: Props) {
  const isEdit = !!equipment;

  const [name, setName]       = useState(equipment?.name ?? '');
  const [brand, setBrand]     = useState(equipment?.brand ?? '');
  const [category, setCategory] = useState(equipment?.category ?? '');
  const [purchaseDate, setPurchaseDate] = useState(
    equipment?.purchaseDate ? new Date(equipment.purchaseDate).toISOString().split('T')[0] : ''
  );
  const [freqDays, setFreqDays] = useState(String(equipment?.maintenanceFrequencyDays ?? 30));
  const [status, setStatus]   = useState(equipment?.status ?? 'OPERATIONAL');
  const [notes, setNotes]     = useState(equipment?.notes ?? '');
  const [error, setError]     = useState('');

  // Catalog search
  const [catalogSearch, setCatalogSearch] = useState('');

  const filteredCatalog = catalogSearch.trim()
    ? catalog.filter(c => c.name.toLowerCase().includes(catalogSearch.toLowerCase()))
    : catalog;

  const groupedCatalog = CATEGORIES.map(cat => ({
    cat,
    label: CATEGORY_LABELS[cat],
    items: filteredCatalog.filter(c => c.category === cat),
  })).filter(g => g.items.length > 0);

  const handleCatalogPick = (item: CatalogItem) => {
    setName(item.name);
    setCategory(item.category);
    setFreqDays(String(item.maintenanceFrequencyDays));
    setCatalogSearch('');
  };

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? equipmentService.update(equipment!.id, data) : equipmentService.create(data),
    onSuccess,
    onError: () => setError('Error al guardar el equipo. Verifica los datos e intenta de nuevo.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('El nombre es requerido');
    if (!category) return setError('La categoría es requerida');
    if (!freqDays || Number(freqDays) < 1) return setError('La frecuencia de mantenimiento debe ser mayor a 0');

    mutation.mutate({
      name: name.trim(),
      brand: brand.trim() || undefined,
      category,
      purchaseDate: purchaseDate || undefined,
      maintenanceFrequencyDays: Number(freqDays),
      notes: notes.trim() || undefined,
      ...(isEdit && { status }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">

      {/* Catalog picker — only on create */}
      {!isEdit && (
        <div className="space-y-1.5">
          <Label>Buscar en catálogo</Label>
          <p className="text-xs text-gray-400">Selecciona un equipo predefinido para rellenar los campos automáticamente, o escríbelos manualmente.</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              placeholder="Buscar equipo del catálogo..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {catalogSearch.trim() && (
            <div className="border border-gray-100 rounded-xl shadow-sm bg-white max-h-48 overflow-y-auto">
              {groupedCatalog.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">Sin resultados</p>
              ) : groupedCatalog.map(g => (
                <div key={g.cat}>
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-bone">{g.label}</p>
                  {g.items.map(item => (
                    <button key={item.name} type="button" onClick={() => handleCatalogPick(item)}
                      className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-primary/10 transition-colors">
                      {item.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label>Nombre del equipo *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Press de Banca" />
      </div>

      {/* Category + Brand */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Categoría *</Label>
          <Select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Seleccionar...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Marca</Label>
          <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ej: Life Fitness" />
        </div>
      </div>

      {/* Purchase date + Maintenance freq */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Fecha de compra</Label>
          <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Mantenimiento cada (días) *</Label>
          <Input type="number" min={1} value={freqDays} onChange={e => setFreqDays(e.target.value)} />
        </div>
      </div>

      {/* Status — edit only */}
      {isEdit && (
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="OPERATIONAL">Operativo</option>
            <option value="MAINTENANCE">En mantenimiento</option>
            <option value="DAMAGED">Dañado</option>
            <option value="OUT_OF_SERVICE">Fuera de servicio</option>
          </Select>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Notas</Label>
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones opcionales..." />
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Agregar equipo'}
        </Button>
      </div>
    </form>
  );
}
