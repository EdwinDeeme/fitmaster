import { api } from '@/lib/api';

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  features: string[];
  limits: {
    maxClients: number;
    maxStaff: number;
    maxStorage: number;
    aiRoutines: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    subscriptions: number;
  };
}

export interface PlanStats {
  totalPlans: number;
  activePlans: number;
  totalMRR: number;
  mostPopular: {
    name: string;
    subscriptions: number;
  };
}

export interface CreatePlanData {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  interval: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  features: string[];
  limits: {
    maxClients: number;
    maxStaff: number;
    maxStorage: number;
    aiRoutines: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
  isActive?: boolean;
  isPopular?: boolean;
  sortOrder?: number;
}

export const plansService = {
  getAll: async (): Promise<Plan[]> => {
    const response = await api.get('/plans');
    return response.data;
  },

  getOne: async (id: string): Promise<Plan> => {
    const response = await api.get(`/plans/${id}`);
    return response.data;
  },

  getStats: async (): Promise<PlanStats> => {
    const response = await api.get('/plans/stats');
    return response.data;
  },

  create: async (data: CreatePlanData): Promise<Plan> => {
    const response = await api.post('/plans', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreatePlanData>): Promise<Plan> => {
    const response = await api.patch(`/plans/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/plans/${id}`);
  },
};
