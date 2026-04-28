import { api } from '@/lib/api';
import { GymMetrics, TrainerMetrics } from '@/types/dashboard';

export interface ActivityItem {
  id: string;
  type: 'client' | 'membership' | 'payment' | 'routine';
  label: string;
  description: string;
  date: string;
}

export const dashboardService = {
  getGymMetrics: async (): Promise<GymMetrics> => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },

  getTrainerMetrics: async (): Promise<TrainerMetrics> => {
    const response = await api.get('/dashboard/trainer-metrics');
    return response.data;
  },

  getRecentActivity: async (): Promise<ActivityItem[]> => {
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  },
};
