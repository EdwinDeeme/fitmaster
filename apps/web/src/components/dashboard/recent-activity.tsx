'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService, ActivityItem } from '@/services/dashboard.service';
import { Users, CreditCard, DollarSign, Dumbbell, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const CONFIG = {
  client:     { icon: Users,      bg: 'bg-blue-50',   color: 'text-blue-600'   },
  membership: { icon: CreditCard, bg: 'bg-purple-50', color: 'text-purple-600' },
  payment:    { icon: DollarSign, bg: 'bg-green-50',  color: 'text-green-600'  },
  routine:    { icon: Dumbbell,   bg: 'bg-orange-50', color: 'text-orange-600' },
} as const;

function ActivityRow({ item }: { item: ActivityItem }) {
  const { icon: Icon, bg, color } = CONFIG[item.type];
  return (
    <div className="flex items-center gap-3 p-3 bg-bone rounded-lg">
      <div className={`p-2 ${bg} rounded-lg shrink-0`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dark truncate">{item.label}</p>
        <p className="text-xs text-gray-500 truncate">{item.description}</p>
      </div>
      <p className="text-xs text-gray-400 shrink-0">
        {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: es })}
      </p>
    </div>
  );
}

export function RecentActivity() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: dashboardService.getRecentActivity,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-4 bg-bone rounded-full mb-3">
          <Dumbbell className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">No hay actividad reciente</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {items.map(item => <ActivityRow key={item.id} item={item} />)}
    </div>
  );
}
