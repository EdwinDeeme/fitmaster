import { api } from '@/lib/api';
import { Equipment } from '@/types/gym';

export const equipmentService = {
  getCatalog: async () => {
    const { data } = await api.get('/equipment/catalog');
    return data;
  },
  getAll: async (): Promise<Equipment[]> => {
    const { data } = await api.get('/equipment');
    return data;
  },
  getOne: async (id: string): Promise<Equipment> => {
    const { data } = await api.get(`/equipment/${id}`);
    return data;
  },
  create: async (dto: any): Promise<Equipment> => {
    const { data } = await api.post('/equipment', dto);
    return data;
  },
  update: async (id: string, dto: any): Promise<Equipment> => {
    const { data } = await api.patch(`/equipment/${id}`, dto);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/equipment/${id}`);
  },
  addMaintenance: async (id: string, dto: any) => {
    const { data } = await api.post(`/equipment/${id}/maintenance`, dto);
    return data;
  },
  updateMaintenance: async (recordId: string, dto: any) => {
    const { data } = await api.patch(`/equipment/maintenance/${recordId}`, dto);
    return data;
  },
};
