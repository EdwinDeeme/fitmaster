import { api } from '@/lib/api';
import { Gym, GymStats } from '@/types/dashboard';

export interface GymDetails extends Gym {
  _count: {
    users: number;
    clients: number;
    memberships: number;
    payments: number;
    routines: number;
    equipment: number;
  };
  subscription?: {
    id: string;
    status: string;
    startDate: string;
    currentPeriodEnd: string;
    plan: {
      id: string;
      name: string;
      price: number;
      currency: string;
    };
    invoices: Array<{
      id: string;
      amount: number;
      status: string;
      dueDate: string;
      paidAt: string | null;
    }>;
  };
  users: Array<{
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  }>;
}

export interface UpdateGymData {
  name?: string;
  subdomain?: string;
  country?: string;
  timezone?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'TRIAL';
  settings?: Record<string, any>;
}

export interface AssignPlanData {
  planId: string;
  startDate: string;
  trialEndDate?: string;
}

export const gymsService = {
  getAll: async (): Promise<Gym[]> => {
    const response = await api.get('/gyms');
    return response.data;
  },

  getOne: async (id: string): Promise<GymDetails> => {
    const response = await api.get(`/gyms/${id}`);
    return response.data;
  },

  getStats: async (): Promise<GymStats> => {
    const response = await api.get('/gyms/stats');
    return response.data;
  },

  update: async (id: string, data: UpdateGymData): Promise<Gym> => {
    const response = await api.patch(`/gyms/${id}`, data);
    return response.data;
  },

  assignPlan: async (id: string, data: AssignPlanData): Promise<any> => {
    const response = await api.post(`/gyms/${id}/assign-plan`, data);
    return response.data;
  },
};
