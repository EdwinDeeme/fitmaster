import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async create(createPlanDto: CreatePlanDto) {
    // Si se marca como popular, desmarcar todos los demás
    if (createPlanDto.isPopular) {
      await this.prisma.plan.updateMany({
        where: { isPopular: true },
        data: { isPopular: false },
      });
    }

    return this.prisma.plan.create({
      data: {
        ...createPlanDto,
        currency: createPlanDto.currency || 'CRC',
        isActive: createPlanDto.isActive ?? true,
        isPopular: createPlanDto.isPopular ?? false,
        sortOrder: createPlanDto.sortOrder ?? 0,
      },
    });
  }

  async findAll() {
    return this.prisma.plan.findMany({
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
        subscriptions: {
          include: {
            gym: {
              select: {
                id: true,
                name: true,
                subdomain: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }

    return plan;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }

    // Si se marca como popular, desmarcar todos los demás
    if (updatePlanDto.isPopular === true) {
      await this.prisma.plan.updateMany({
        where: { 
          isPopular: true,
          NOT: { id },
        },
        data: { isPopular: false },
      });
    }

    return this.prisma.plan.update({
      where: { id },
      data: updatePlanDto,
    });
  }

  async remove(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }

    // No permitir eliminar planes con suscripciones activas
    if (plan._count.subscriptions > 0) {
      throw new Error(
        `Cannot delete plan with active subscriptions. Please deactivate the plan instead.`,
      );
    }

    return this.prisma.plan.delete({
      where: { id },
    });
  }

  async getStats() {
    const totalPlans = await this.prisma.plan.count();
    const activePlans = await this.prisma.plan.count({
      where: { isActive: true },
    });

    const subscriptions = await this.prisma.subscription.groupBy({
      by: ['planId'],
      _count: true,
      where: {
        status: 'ACTIVE',
      },
    });

    // Calcular MRR (Monthly Recurring Revenue)
    const plans = await this.prisma.plan.findMany({
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    let totalMRR = 0;
    plans.forEach((plan) => {
      const activeSubscriptions = plan.subscriptions.length;
      const planPrice = Number(plan.price);
      
      // Convertir a MRR según el intervalo
      let monthlyPrice = planPrice;
      if (plan.interval === 'QUARTERLY') {
        monthlyPrice = planPrice / 3;
      } else if (plan.interval === 'ANNUAL') {
        monthlyPrice = planPrice / 12;
      }
      
      totalMRR += monthlyPrice * activeSubscriptions;
    });

    // Primero intentar encontrar el plan marcado manualmente como popular
    let popularPlan = await this.prisma.plan.findFirst({
      where: { isPopular: true },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    // Si no hay plan marcado manualmente, calcular el más popular por suscripciones
    if (!popularPlan && subscriptions.length > 0) {
      const mostPopularPlan = subscriptions.sort((a, b) => b._count - a._count)[0];
      if (mostPopularPlan) {
        popularPlan = await this.prisma.plan.findUnique({
          where: { id: mostPopularPlan.planId },
          include: {
            _count: {
              select: {
                subscriptions: true,
              },
            },
          },
        });
      }
    }

    let popularPlanName = 'N/A';
    let popularPlanCount = 0;

    if (popularPlan) {
      popularPlanName = popularPlan.name;
      popularPlanCount = popularPlan._count.subscriptions;
    }

    return {
      totalPlans,
      activePlans,
      totalMRR,
      mostPopular: {
        name: popularPlanName,
        subscriptions: popularPlanCount,
      },
    };
  }
}
