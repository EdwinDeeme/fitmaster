export type GoalType = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'STRENGTH' | 'ENDURANCE';
export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Exercise {
  name: string;
  sets: number;
  reps: number | string;
  restSeconds: number;
  notes?: string;
  muscleGroups?: string[];
}

export interface WorkoutDay {
  name: string;
  exercises: Exercise[];
}

export interface Routine {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  targetGoal: GoalType;
  difficulty: DifficultyLevel;
  durationWeeks: number;
  weeklySchedule: Record<string, WorkoutDay>;
  createdBy: string;
  isAIGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { assignments: number };
  assignments?: RoutineAssignment[];
}

export interface RoutineAssignment {
  id: string;
  gymId: string;
  routineId: string;
  clientId: string;
  startDate: string;
  isActive: boolean;
  assignedAt: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    weight?: number;
    height?: number;
    bmi?: number;
    dateOfBirth?: string;
  };
  routine?: {
    id: string;
    name: string;
    difficulty: DifficultyLevel;
  };
}

export interface CreateRoutineData {
  name: string;
  description?: string;
  targetGoal: GoalType;
  difficulty: DifficultyLevel;
  durationWeeks: number;
  weeklySchedule: Record<string, WorkoutDay>;
}

export interface AssignRoutineData {
  clientId: string;
  startDate: string;
}

export const GOAL_LABELS: Record<GoalType, string> = {
  WEIGHT_LOSS: 'Pérdida de peso',
  MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento',
  STRENGTH: 'Fuerza',
  ENDURANCE: 'Resistencia',
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
};

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  BEGINNER: 'bg-green-100 text-green-700',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-700',
  ADVANCED: 'bg-red-100 text-red-700',
};

export const GOAL_COLORS: Record<GoalType, string> = {
  WEIGHT_LOSS: 'bg-blue-100 text-blue-700',
  MUSCLE_GAIN: 'bg-purple-100 text-purple-700',
  MAINTENANCE: 'bg-gray-100 text-gray-700',
  STRENGTH: 'bg-orange-100 text-orange-700',
  ENDURANCE: 'bg-teal-100 text-teal-700',
};
