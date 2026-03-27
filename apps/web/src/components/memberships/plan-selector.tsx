'use client';

import { useState } from 'react';
import { MembershipPlan } from '@/services/membership-plans.service';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2 } from 'lucide-react';

const typeLabels: Record<string, string> = {
  MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual', COMBINED: 'Combinado',
};
const typeVariant: Record<string, any> = {
  MONTHLY: 'secondary', QUARTERLY: 'warning', ANNUAL: 'success', COMBINED: 'default',
};

// What we return when a plan is selected — for COMBINED it includes the chosen period
export interface SelectedPlan extends MembershipPlan {
  selectedType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  selectedPrice: number;
}

interface Props {
  plans: MembershipPlan[];
  selected: SelectedPlan | null;
  onSelect: (plan: SelectedPlan) => void;
}

const PERIOD_OPTIONS: { type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'; label: string; key: keyof NonNullable<MembershipPlan['prices']> }[] = [
  { type: 'MONTHLY',   label: 'Mensual',    key: 'monthly'   },
  { type: 'QUARTERLY', label: 'Trimestral', key: 'quarterly' },
  { type: 'ANNUAL',    label: 'Anual',      key: 'annual'    },
];

export function PlanSelector({ plans, selected, onSelect }: Props) {
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = plans.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter ? p.type === typeFilter : true;
    return p.isActive && matchSearch && matchType;
  });

  const handleSelect = (plan: MembershipPlan) => {
    if (plan.type === 'COMBINED') {
      // Toggle expand to pick period
      setExpandedId(prev => prev === plan.id ? null : plan.id);
    } else {
      onSelect({ ...plan, selectedType: plan.type as any, selectedPrice: Number(plan.price) });
      setExpandedId(null);
    }
  };

  const handlePeriodSelect = (plan: MembershipPlan, type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL', price: number) => {
    onSelect({ ...plan, selectedType: type, selectedPrice: price });
    setExpandedId(null);
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar plan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-1 bg-bone p-1 rounded-lg shrink-0">
          {[['', 'Todos'], ['MONTHLY', 'Mensual'], ['QUARTERLY', 'Trimestral'], ['ANNUAL', 'Anual'], ['COMBINED', 'Combinado']].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setTypeFilter(val)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                typeFilter === val ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Plans list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No hay planes disponibles</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
          {filtered.map(plan => {
            const isSelected = selected?.id === plan.id;
            const isExpanded = expandedId === plan.id;

            return (
              <div key={plan.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleSelect(plan)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelected && <CheckCircle2 size={15} className="text-primary shrink-0" />}
                      <span className="font-medium text-dark text-sm truncate">{plan.name}</span>
                      <Badge variant={typeVariant[plan.type]}>{typeLabels[plan.type]}</Badge>
                    </div>
                    {plan.type !== 'COMBINED' && (
                      <span className="font-semibold text-dark text-sm shrink-0">
                        ₡{Number(plan.price).toLocaleString('es-CR')}
                      </span>
                    )}
                    {plan.type === 'COMBINED' && (
                      <span className="text-xs text-gray-400 shrink-0">
                        {isExpanded
                          ? 'Cerrar ▲'
                          : isSelected && selected?.selectedType
                            ? `${typeLabels[selected.selectedType]} ▼`
                            : 'Elegir período ▼'}
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{plan.description}</p>
                  )}
                </button>

                {/* Period picker for COMBINED plans */}
                {plan.type === 'COMBINED' && isExpanded && (
                  <div className="ml-2 grid grid-cols-3 gap-2">
                    {PERIOD_OPTIONS.map(({ type, label, key }) => {
                      const price = plan.prices?.[key];
                      if (!price) return null;
                      const isPeriodSelected = isSelected && selected?.selectedType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handlePeriodSelect(plan, type, price)}
                          className={`p-2.5 rounded-lg border-2 text-left transition-all ${
                            isPeriodSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-100 hover:border-primary/40 bg-white'
                          }`}
                        >
                          <p className="text-xs text-gray-500 font-medium">{label}</p>
                          <p className="text-sm font-bold text-dark mt-0.5">
                            ₡{Number(price).toLocaleString('es-CR')}
                          </p>
                          {isPeriodSelected && <CheckCircle2 size={12} className="text-primary mt-1" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
