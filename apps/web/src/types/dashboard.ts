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
}

export interface Gym {
  id: string;
  name: string;
  subdomain: string;
  country: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    clients: number;
    memberships: number;
  };
}
