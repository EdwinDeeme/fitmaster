import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGymDto, UpdateGymDto, AssignPlanDto } from './dto';

@Injectable()
export class GymsService {
  constructor(private prisma: PrismaService) {}

  async create(createGymDto: CreateGymDto) {
    // Verificar que el subdominio no exista
    const existing = await this.prisma.gym.findUnique({
      where: { subdomain: createGymDto.subdomain },
    });

    if (existing) {
      throw new ConflictException(
        `Gym with subdomain ${createGymDto.subdomain} already exists`,
      );
    }

    return this.prisma.gym.create({
      data: {
        ...createGymDto,
        country: createGymDto.country || 'CR',
        timezone: createGymDto.timezone || 'America/Costa_Rica',
        status: createGymDto.status || 'TRIAL',
      },
    });
  }

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
        subscription: {
          include: {
            plan: {
              select: {
                name: true,
                price: true,
                currency: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            memberships: true,
            payments: true,
            routines: true,
            equipment: true,
          },
        },
        subscription: {
          include: {
            plan: true,
            invoices: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 5,
            },
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!gym) {
      throw new NotFoundException(`Gym with id ${id} not found`);
    }

    return gym;
  }

  async update(id: string, updateGymDto: UpdateGymDto) {
    const gym = await this.prisma.gym.findUnique({
      where: { id },
    });

    if (!gym) {
      throw new NotFoundException(`Gym with id ${id} not found`);
    }

    // Si se está actualizando el subdominio, verificar que no exista
    if (updateGymDto.subdomain && updateGymDto.subdomain !== gym.subdomain) {
      const existing = await this.prisma.gym.findUnique({
        where: { subdomain: updateGymDto.subdomain },
      });

      if (existing) {
        throw new ConflictException(
          `Gym with subdomain ${updateGymDto.subdomain} already exists`,
        );
      }
    }

    return this.prisma.gym.update({
      where: { id },
      data: updateGymDto,
    });
  }

  async remove(id: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id },
    });

    if (!gym) {
      throw new NotFoundException(`Gym with id ${id} not found`);
    }

    return this.prisma.gym.delete({
      where: { id },
    });
  }

  async assignPlan(gymId: string, assignPlanDto: AssignPlanDto) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) {
      throw new NotFoundException(`Gym with id ${gymId} not found`);
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: assignPlanDto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with id ${assignPlanDto.planId} not found`);
    }

    const startDate = new Date(assignPlanDto.startDate);
    const currentPeriodEnd = new Date(startDate);
    
    // Calcular el fin del período según el intervalo del plan
    if (plan.interval === 'MONTHLY') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else if (plan.interval === 'QUARTERLY') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
    } else if (plan.interval === 'ANNUAL') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    // Normalizar trialEndDate: convertir string vacío a null
    const trialEndDate = assignPlanDto.trialEndDate && assignPlanDto.trialEndDate.trim() !== '' 
      ? new Date(assignPlanDto.trialEndDate) 
      : null;

    // Verificar si ya existe una suscripción
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { gymId },
    });

    if (existingSubscription) {
      // Actualizar suscripción existente
      return this.prisma.subscription.update({
        where: { gymId },
        data: {
          planId: assignPlanDto.planId,
          status: trialEndDate ? 'TRIALING' : 'ACTIVE',
          startDate,
          trialEndDate,
          currentPeriodStart: startDate,
          currentPeriodEnd,
        },
        include: {
          plan: true,
          gym: true,
        },
      });
    }

    // Crear nueva suscripción
    return this.prisma.subscription.create({
      data: {
        gymId,
        planId: assignPlanDto.planId,
        status: trialEndDate ? 'TRIALING' : 'ACTIVE',
        startDate,
        trialEndDate,
        currentPeriodStart: startDate,
        currentPeriodEnd,
      },
      include: {
        plan: true,
        gym: true,
      },
    });
  }

  async getStats() {
    const totalGyms = await this.prisma.gym.count();
    
    // Contar solo usuarios que pertenecen a gimnasios (excluir SUPER_ADMIN)
    const totalUsers = await this.prisma.user.count({
      where: {
        gymId: {
          not: null,
        },
      },
    });
    
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

    // Contar gimnasios por estado
    const gymsByStatus = await this.prisma.gym.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusCounts = {
      active: 0,
      suspended: 0,
      inactive: 0,
      trial: 0,
    };

    gymsByStatus.forEach((group) => {
      statusCounts[group.status.toLowerCase() as keyof typeof statusCounts] = group._count;
    });

    return {
      totalGyms,
      totalUsers,
      totalClients,
      totalRevenue: payments._sum.amount || 0,
      gymsByStatus: statusCounts,
    };
  }
}
