import { api } from '@/lib/api';
import { Client, PhysicalProgress } from '@/types/gym';

export const clientsService = {
  getAll: async (): Promise<Client[]> => {
    const { data } = await api.get('/clients');
    return data;
  },
  getOne: async (id: string): Promise<Client> => {
    const { data } = await api.get(`/clients/${id}`);
    return data;
  },
  create: async (dto: any): Promise<Client> => {
    const { data } = await api.post('/clients', dto);
    return data;
  },
  update: async (id: string, dto: any): Promise<Client> => {
    const { data } = await api.patch(`/clients/${id}`, dto);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
  addProgress: async (clientId: string, dto: {
    weight: number;
    bodyFatPercentage?: number;
    measurements?: { chest?: number; waist?: number; hips?: number; arms?: number; thighs?: number };
    notes?: string;
    date?: string;
  }): Promise<PhysicalProgress> => {
    const { data } = await api.post(`/clients/${clientId}/progress`, dto);
    return data;
  },
  getProgress: async (clientId: string): Promise<PhysicalProgress[]> => {
    const { data } = await api.get(`/clients/${clientId}/progress`);
    return data;
  },
  updateGoal: async (clientId: string, dto: { targetWeight?: number; targetDate?: string }): Promise<Client> => {
    const { data } = await api.patch(`/clients/${clientId}/goal`, dto);
    return data;
  },
};
