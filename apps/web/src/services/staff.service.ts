import { api } from '@/lib/api';
import { StaffMember, StaffMemberDetail } from '@/types/gym';

export const staffService = {
  getAll: async (): Promise<StaffMember[]> => {
    const { data } = await api.get('/staff');
    return data;
  },
  getOne: async (id: string): Promise<StaffMemberDetail> => {
    const { data } = await api.get(`/staff/${id}`);
    return data;
  },
  create: async (dto: any): Promise<StaffMember> => {
    const { data } = await api.post('/staff', dto);
    return data;
  },
  update: async (id: string, dto: any): Promise<StaffMember> => {
    const { data } = await api.patch(`/staff/${id}`, dto);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/staff/${id}`);
  },
  resetPassword: async (id: string, newPassword: string) => {
    const { data } = await api.post(`/staff/${id}/reset-password`, { newPassword });
    return data;
  },
};
