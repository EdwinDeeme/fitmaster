import { api } from '@/lib/api';

export interface MembershipPlan {
  id: string;
  name: string;
  description?: string;
  type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  price: number;
  isActive: boolean;
  activeUsers?: number;
}

export const membershipPlansService = {
  getAll: async (): Promise<MembershipPlan[]> => {
    const res = await api.get('/membership-plans');
    return res.data;
  },
  create: async (data: Omit<MembershipPlan, 'id' | 'isActive'>): Promise<MembershipPlan> => {
    const res = await api.post('/membership-plans', data);
    return res.data;
  },
  update: async (id: string, data: Partial<MembershipPlan>): Promise<MembershipPlan> => {
    const res = await api.patch(`/membership-plans/${id}`, data);
    return res.data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/membership-plans/${id}`);
  },
};
