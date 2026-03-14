import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { RoutineFilters } from '@/services/routines.service';

interface RoutineFiltersBarProps {
  filters: RoutineFilters;
  onChange: (filters: RoutineFilters) => void;
}

export function RoutineFiltersBar({ filters, onChange }: RoutineFiltersBarProps) {
  const hasActiveFilters = filters.search || filters.difficulty || filters.targetGoal;

  const clear = () => onChange({ search: '', difficulty: '', targetGoal: '' });

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Buscar rutinas..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      <Select
        value={filters.difficulty || ''}
        onChange={(e) => onChange({ ...filters, difficulty: e.target.value })}
        className="sm:w-44"
      >
        <option value="">Dificultad</option>
        <option value="BEGINNER">Principiante</option>
        <option value="INTERMEDIATE">Intermedio</option>
        <option value="ADVANCED">Avanzado</option>
      </Select>

      <Select
        value={filters.targetGoal || ''}
        onChange={(e) => onChange({ ...filters, targetGoal: e.target.value })}
        className="sm:w-52"
      >
        <option value="">Objetivo</option>
        <option value="WEIGHT_LOSS">Pérdida de peso</option>
        <option value="MUSCLE_GAIN">Ganancia muscular</option>
        <option value="MAINTENANCE">Mantenimiento</option>
        <option value="STRENGTH">Fuerza</option>
        <option value="ENDURANCE">Resistencia</option>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="shrink-0">
          <X className="h-4 w-4 mr-1" /> Limpiar
        </Button>
      )}
    </div>
  );
}
