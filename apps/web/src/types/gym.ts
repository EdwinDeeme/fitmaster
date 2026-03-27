export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type GoalType = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'STRENGTH' | 'ENDURANCE';
export type ClientStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type MembershipType = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type MembershipStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELLED';
export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'SINPE_MOVIL' | 'CASH';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type EquipmentCategory = 'CARDIO' | 'STRENGTH' | 'FREE_WEIGHTS' | 'FUNCTIONAL' | 'ACCESSORIES';
export type EquipmentStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'DAMAGED' | 'OUT_OF_SERVICE';
export type UserRole = 'GYM_ADMIN' | 'TRAINER' | 'RECEPTIONIST';
export type ExpenseCategory = 'RENT' | 'UTILITIES' | 'EQUIPMENT' | 'SALARIES' | 'MAINTENANCE' | 'MARKETING' | 'SUPPLIES' | 'OTHER';

export interface Client {
  id: string;
  gymId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  gender: Gender;
  weight: number;
  height: number;
  bmi: number;
  bodyFatPercentage?: number;
  goalType: GoalType;
  targetWeight?: number;
  targetDate?: string;
  status: ClientStatus;
  createdAt: string;
  memberships?: Membership[];
  physicalProgress?: PhysicalProgress[];
  routineAssignments?: RoutineAssignment[];
  _count?: { routineAssignments: number };
}

export interface Membership {
  id: string;
  gymId: string;
  clientId: string;
  type: MembershipType;
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  price: number;
  autoRenew: boolean;
  createdAt: string;
  client?: Pick<Client, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  gymId: string;
  clientId?: string;
  membershipId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  sinpeReference?: string;
  metadata?: any;
  createdAt: string;
  client?: Pick<Client, 'id' | 'firstName' | 'lastName' | 'email'>;
  membership?: Membership & { client?: Pick<Client, 'id' | 'firstName' | 'lastName' | 'email'> };
}

export interface Expense {
  id: string;
  gymId: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface FinanceSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  payments: Payment[];
  expenses: Expense[];
}

export interface Routine {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  targetGoal: GoalType;
  difficulty: DifficultyLevel;
  durationWeeks: number;
  weeklySchedule: any;
  createdBy: string;
  isAIGenerated: boolean;
  createdAt: string;
  creator?: { id: string; firstName: string; lastName: string; role: string };
  assignments?: RoutineAssignment[];
  _count?: { assignments: number };
}

export interface RoutineAssignment {
  id: string;
  routineId: string;
  clientId: string;
  startDate: string;
  isActive: boolean;
  client?: Pick<Client, 'id' | 'firstName' | 'lastName' | 'email'>;
  routine?: Pick<Routine, 'id' | 'name' | 'difficulty' | 'targetGoal' | 'durationWeeks'>;
}

export interface PhysicalProgress {
  id: string;
  clientId: string;
  date: string;
  weight: number;
  bodyFatPercentage?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  notes?: string;
  createdAt: string;
}

export interface Equipment {
  id: string;
  gymId: string;
  name: string;
  brand?: string;
  category: EquipmentCategory;
  purchaseDate?: string;
  status: EquipmentStatus;
  maintenanceFrequencyDays: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  notes?: string;
  createdAt: string;
  maintenanceRecords?: MaintenanceRecord[];
  _count?: { maintenanceRecords: number };
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  date: string;
  type: 'ROUTINE' | 'REPAIR' | 'REPLACEMENT';
  description: string;
  cost?: number;
  performedBy: string;
}

export interface StaffMember {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt: string;
  metrics?: {
    routinesCreated: number;
    activeAssignedClients: number;
    maintenancePerformed: number;
    clientsCreated: number;
  };
}

export interface StaffRoutineActivity {
  id: string;
  name: string;
  difficulty: DifficultyLevel;
  targetGoal: GoalType;
  createdAt: string;
  _count?: { assignments: number };
}

export interface StaffMaintenanceActivity {
  id: string;
  date: string;
  type: 'ROUTINE' | 'REPAIR' | 'REPLACEMENT';
  description: string;
  cost?: number;
  equipment: { id: string; name: string };
}

export interface StaffClientActivity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  weight: number;
  height: number;
  bmi: number;
  dateOfBirth: string;
  createdAt: string;
}

export interface StaffMemberDetail extends StaffMember {
  activity: {
    routines: StaffRoutineActivity[];
    maintenance: StaffMaintenanceActivity[];
    clients: StaffClientActivity[];
  };
}
