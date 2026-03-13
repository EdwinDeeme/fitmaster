import { api } from '@/lib/api';
import { GymMetrics, TrainerMetrics } from '@/types/dashboard';

export const dashboardService = {
  getGymMetrics: async (): Promise<GymMetrics> => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },

  getTrainerMetrics: async (): Promise<TrainerMetrics> => {
    const response = await api.get('/dashboard/trainer-metrics');
    return response.data;
  },
};
