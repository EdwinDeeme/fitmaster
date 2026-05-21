import api from './api';

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  weight: number;
  height: number;
  bmi: number;
  bodyFatPercentage?: number;
  goalType: string;
  targetWeight?: number;
  targetDate?: string;
  status: string;
  memberships?: Membership[];
  physicalProgress?: Progress[];
  routineAssignments?: RoutineAssignment[];
}

export interface Membership {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  price: number;
}

export interface Progress {
  id: string;
  date: string;
  weight: number;
  bodyFatPercentage?: number;
  measurements?: {
    waist?: number;
    chest?: number;
    arms?: number;
    hips?: number;
    thighs?: number;
  };
  notes?: string;
}

export interface RoutineAssignment {
  id: string;
  routineId: string;
  startDate: string;
  isActive: boolean;
  routine?: {
    id: string;
    name: string;
    difficulty: string;
    targetGoal: string;
    durationWeeks: number;
    weeklySchedule: any;
  };
}

export interface Equipment {
  id: string;
  name: string;
  brand?: string;
  category: string;
}

export async function getMyProfile(): Promise<ClientProfile> {
  const { data } = await api.get('/api/v1/clients/me');
  return data;
}

export async function getEquipment(): Promise<Equipment[]> {
  const { data } = await api.get('/api/v1/equipment');
  return data;
}

export async function addProgress(dto: {
  weight: number;
  bodyFatPercentage?: number;
  measurements?: {
    waist?: number; chest?: number; arms?: number; hips?: number; thighs?: number;
  };
  notes?: string;
}): Promise<Progress> {
  // We need the client id — get it from profile first
  const profile = await getMyProfile();
  const { data } = await api.post(`/api/v1/clients/${profile.id}/progress`, dto);
  return data;
}

export interface ExerciseLog {
  id: string;
  exerciseName: string;
  date: string;
  sets: number;
  reps: string;
  weightKg: number;
  notes?: string;
}

export async function getExerciseLogs(clientId: string, routineId: string): Promise<Record<string, ExerciseLog[]>> {
  const { data } = await api.get(`/api/v1/routines/clients/${clientId}/routines/${routineId}/logs`);
  return data;
}

export async function logExercise(clientId: string, routineId: string, dto: {
  exerciseName: string;
  sets: number;
  reps: string;
  weightKg: number;
  notes?: string;
}): Promise<ExerciseLog> {
  const { data } = await api.post(`/api/v1/routines/clients/${clientId}/routines/${routineId}/logs`, dto);
  return data;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  weeklySchedule: Record<string, WorkoutDay>;
  difficulty: string;
  targetGoal: string;
  durationWeeks: number;
}

export interface WorkoutDay {
  name: string;
  exercises: Exercise[];
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number | string;
  restSeconds: number;
  notes?: string;
  muscleGroups?: string[];
}

export async function getRoutines(): Promise<Routine[]> {
  const profile = await getMyProfile();
  const assignments = profile.routineAssignments || [];
  
  return assignments
    .filter(a => a.isActive && a.routine)
    .map(a => a.routine!);
}

export async function getExerciseLogsForExercise(exerciseName: string): Promise<ExerciseLog[]> {
  const profile = await getMyProfile();
  const { data } = await api.get(`/api/v1/clients/${profile.id}/exercise-logs?exerciseName=${encodeURIComponent(exerciseName)}`);
  return data;
}

export async function createExerciseLog(exerciseName: string, dto: {
  weight: number;
  sets: number;
  reps: number;
  notes?: string;
}): Promise<ExerciseLog> {
  const profile = await getMyProfile();
  const { data } = await api.post(`/api/v1/clients/${profile.id}/exercise-logs`, {
    exerciseName,
    weightKg: dto.weight,
    sets: dto.sets,
    reps: dto.reps.toString(),
    notes: dto.notes,
  });
  return data;
}
