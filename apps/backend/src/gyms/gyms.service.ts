import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GymsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.gym.findMany({
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            memberships: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.gym.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            memberships: true,
            payments: true,
          },
        },
      },
    });
  }

  async getStats() {
    const totalGyms = await this.prisma.gym.count();
    const totalUsers = await this.prisma.user.count();
    const totalClients = await this.prisma.client.count();
    
    // Get total revenue from completed payments
    const payments = await this.prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalGyms,
      totalUsers,
      totalClients,
      totalRevenue: payments._sum.amount || 0,
    };
  }
}
