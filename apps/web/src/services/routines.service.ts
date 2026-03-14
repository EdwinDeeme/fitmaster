import { api } from '@/lib/api';
import { Routine, CreateRoutineData, AssignRoutineData } from '@/types/routines';

export interface RoutineFilters {
  difficulty?: string;
  targetGoal?: string;
  search?: string;
}

export const routinesService = {
  getAll: async (filters?: RoutineFilters): Promise<Routine[]> => {
    const response = await api.get('/routines', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Routine> => {
    const response = await api.get(`/routines/${id}`);
    return response.data;
  },

  create: async (data: CreateRoutineData): Promise<Routine> => {
    const response = await api.post('/routines', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateRoutineData>): Promise<Routine> => {
    const response = await api.put(`/routines/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/routines/${id}`);
  },

  assign: async (routineId: string, data: AssignRoutineData) => {
    const response = await api.post(`/routines/${routineId}/assign`, data);
    return response.data;
  },

  unassign: async (assignmentId: string): Promise<void> => {
    await api.delete(`/routines/assignments/${assignmentId}`);
  },

  getClientRoutine: async (clientId: string): Promise<Routine | null> => {
    const response = await api.get(`/routines/client/${clientId}`);
    return response.data;
  },
};
