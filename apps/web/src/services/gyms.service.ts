import { api } from '@/lib/api';
import { Gym, GymStats } from '@/types/dashboard';

export const gymsService = {
  getAll: async (): Promise<Gym[]> => {
    const response = await api.get('/gyms');
    return response.data;
  },

  getStats: async (): Promise<GymStats> => {
    const response = await api.get('/gyms/stats');
    return response.data;
  },

  getOne: async (id: string): Promise<Gym> => {
    const response = await api.get(`/gyms/${id}`);
    return response.data;
  },
};
