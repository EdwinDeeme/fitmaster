import { api } from '@/lib/api';
import { Routine, CreateRoutineData, AssignRoutineData, ExerciseLog } from '@/types/routines';

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

  getRecent: async (limit = 5): Promise<Routine[]> => {
    const response = await api.get('/routines/recent', { params: { limit } });
    return response.data;
  },

  logExercise: async (clientId: string, routineId: string, dto: {
    exerciseName: string;
    sets: number;
    reps: string;
    weightKg: number;
    weekNumber?: number;
    notes?: string;
    date?: string;
  }) => {
    const response = await api.post(`/routines/clients/${clientId}/routines/${routineId}/logs`, dto);
    return response.data;
  },

  getExerciseLogs: async (clientId: string, routineId: string): Promise<Record<string, ExerciseLog[]>> => {
    const response = await api.get(`/routines/clients/${clientId}/routines/${routineId}/logs`);
    return response.data;
  },
};
