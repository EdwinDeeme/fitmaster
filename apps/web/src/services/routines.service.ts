import { api } from '@/lib/api';
import { Routine } from '@/types/gym';

export const routinesService = {
  getAll: async (): Promise<Routine[]> => {
    const { data } = await api.get('/routines');
    return data;
  },
  getOne: async (id: string): Promise<Routine> => {
    const { data } = await api.get(`/routines/${id}`);
    return data;
  },
  create: async (dto: any): Promise<Routine> => {
    const { data } = await api.post('/routines', dto);
    return data;
  },
  update: async (id: string, dto: any): Promise<Routine> => {
    const { data } = await api.patch(`/routines/${id}`, dto);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/routines/${id}`);
  },
  assign: async (dto: { clientId: string; routineId: string; startDate: string }) => {
    const { data } = await api.post('/routines/assign', dto);
    return data;
  },
};
