import { api } from '@/lib/api';
import { Membership } from '@/types/gym';

export const membershipsService = {
  getAll: async (): Promise<Membership[]> => {
    const { data } = await api.get('/memberships');
    return data;
  },
  getOne: async (id: string): Promise<Membership> => {
    const { data } = await api.get(`/memberships/${id}`);
    return data;
  },
  getStats: async () => {
    const { data } = await api.get('/memberships/stats');
    return data;
  },
  create: async (dto: any): Promise<Membership> => {
    const { data } = await api.post('/memberships', dto);
    return data;
  },
  updateStatus: async (id: string, status: string): Promise<Membership> => {
    const { data } = await api.patch(`/memberships/${id}/status`, { status });
    return data;
  },
};
