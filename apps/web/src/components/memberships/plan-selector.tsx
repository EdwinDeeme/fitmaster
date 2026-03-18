'use client';

import { useState } from 'react';
import { MembershipPlan } from '@/services/membership-plans.service';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CheckCircle2 } from 'lucide-react';

const typeLabels: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual' };
const typeVariant: Record<string, any> = { MONTHLY: 'secondary', QUARTERLY: 'warning', ANNUAL: 'success' };

interface Props {
  plans: MembershipPlan[];
  selected: MembershipPlan | null;
  onSelect: (plan: MembershipPlan) => void;
}

export function PlanSelector({ plans, selected, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = plans.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter ? p.type === typeFilter : true;
    return p.isActive && matchSearch && matchType;
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar plan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-36">
          <option value="">Todos</option>
          <option value="MONTHLY">Mensual</option>
          <option value="QUARTERLY">Trimestral</option>
          <option value="ANNUAL">Anual</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No hay planes disponibles</p>
      ) : (
        <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
          {filtered.map(plan => (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                selected?.id === plan.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selected?.id === plan.id && <CheckCircle2 size={15} className="text-primary shrink-0" />}
                  <span className="font-medium text-dark text-sm">{plan.name}</span>
                  <Badge variant={typeVariant[plan.type]}>{typeLabels[plan.type]}</Badge>
                </div>
                <span className="font-semibold text-dark text-sm">₡{Number(plan.price).toLocaleString('es-CR')}</span>
              </div>
              {plan.description && (
                <p className="text-xs text-gray-500 mt-1 ml-0">{plan.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
