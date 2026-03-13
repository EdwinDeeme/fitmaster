import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getGymMetrics(gymId: string) {
    if (!gymId) {
      throw new Error('gymId is required for gym metrics');
    }

    // Get active clients count
    const activeClients = await this.prisma.client.count({
      where: {
        gymId,
        status: 'ACTIVE',
      },
    });

    // Get active memberships count
    const activeMemberships = await this.prisma.membership.count({
      where: {
        gymId,
        status: 'ACTIVE',
      },
    });

    // Get current month revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await this.prisma.payment.aggregate({
      where: {
        gymId,
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Get new clients this month
    const newClients = await this.prisma.client.count({
      where: {
        gymId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Get expiring memberships (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const expiringMemberships = await this.prisma.membership.findMany({
      where: {
        gymId,
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
          lte: nextWeek,
        },
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        endDate: 'asc',
      },
      take: 10,
    });

    return {
      activeClients,
      activeMemberships,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      newClients,
      expiringMemberships,
    };
  }

  async getTrainerMetrics(gymId: string, trainerId: string) {
    if (!gymId) {
      throw new Error('gymId is required for trainer metrics');
    }

    // Get assigned clients (routines assigned by this trainer)
    const assignedClients = await this.prisma.routineAssignment.findMany({
      where: {
        gymId,
        routine: {
          createdBy: trainerId,
        },
        isActive: true,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      distinct: ['clientId'],
    });

    // Get routines created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const routinesCreated = await this.prisma.routine.count({
      where: {
        gymId,
        createdBy: trainerId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    return {
      assignedClients: assignedClients.length,
      assignedClientsList: assignedClients.map(a => a.client),
      routinesCreated,
    };
  }
}
