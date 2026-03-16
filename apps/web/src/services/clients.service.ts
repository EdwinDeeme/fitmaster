import { api } from '@/lib/api';
import { Client } from '@/types/gym';

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
};
