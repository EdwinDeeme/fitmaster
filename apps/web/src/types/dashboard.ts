export interface GymMetrics {
  activeClients: number;
  activeMemberships: number;
  monthlyRevenue: number;
  newClients: number;
  expiringMemberships: ExpiringMembership[];
}

export interface ExpiringMembership {
  id: string;
  endDate: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TrainerMetrics {
  assignedClients: number;
  assignedClientsList: AssignedClient[];
  routinesCreated: number;
}

export interface AssignedClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface GymStats {
  totalGyms: number;
  totalUsers: number;
  totalClients: number;
  totalRevenue: number;
  gymsByStatus?: {
    active: number;
    suspended: number;
    inactive: number;
    trial: number;
  };
}

export interface Gym {
  id: string;
  name: string;
  subdomain: string;
  country: string;
  timezone: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'TRIAL';
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    clients: number;
    memberships: number;
  };
  subscription?: {
    id: string;
    status: string;
    plan: {
      name: string;
      price: number;
      currency: string;
    };
  };
}
