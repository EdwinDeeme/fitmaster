import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getGymMetrics(gymId: string) {
    if (!gymId) throw new Error('gymId is required for gym metrics');

    const activeClients = await this.prisma.client.count({ where: { gymId, status: 'ACTIVE' } });
    const activeMemberships = await this.prisma.membership.count({ where: { gymId, status: 'ACTIVE' } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await this.prisma.payment.aggregate({
      where: { gymId, status: 'COMPLETED', createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    });

    const newClients = await this.prisma.client.count({
      where: { gymId, createdAt: { gte: startOfMonth } },
    });

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const expiringMemberships = await this.prisma.membership.findMany({
      where: { gymId, status: 'ACTIVE', endDate: { gte: new Date(), lte: nextWeek } },
      include: { client: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { endDate: 'asc' },
      take: 10,
    });

    return { activeClients, activeMemberships, monthlyRevenue: monthlyRevenue._sum.amount || 0, newClients, expiringMemberships };
  }

  async getTrainerMetrics(gymId: string, trainerId: string) {
    if (!gymId) throw new Error('gymId is required for trainer metrics');

    const assignedClients = await this.prisma.routineAssignment.findMany({
      where: { gymId, routine: { createdBy: trainerId }, isActive: true },
      include: { client: { select: { id: true, firstName: true, lastName: true, email: true } } },
      distinct: ['clientId'],
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const routinesCreated = await this.prisma.routine.count({
      where: { gymId, createdBy: trainerId, createdAt: { gte: startOfMonth } },
    });

    return {
      assignedClients: assignedClients.length,
      assignedClientsList: assignedClients.map(a => a.client),
      routinesCreated,
    };
  }

  async getRecentActivity(gymId: string) {
    const limit = 5;

    const [clients, memberships, payments, routines] = await Promise.all([
      this.prisma.client.findMany({
        where: { gymId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, firstName: true, lastName: true, createdAt: true },
      }),
      this.prisma.membership.findMany({
        where: { gymId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true, type: true, status: true, createdAt: true,
          client: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.payment.findMany({
        where: { gymId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true, amount: true, method: true, createdAt: true,
          membership: {
            select: { client: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      this.prisma.routine.findMany({
        where: { gymId },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: { id: true, name: true, updatedAt: true, createdAt: true },
      }),
    ]);

    const typeLabels: Record<string, string> = {
      MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual', COMBINED: 'Combinado',
    };
    const methodLabels: Record<string, string> = {
      CASH: 'Efectivo', SINPE_MOVIL: 'SINPE Móvil',
      CREDIT_CARD: 'Tarjeta crédito', DEBIT_CARD: 'Tarjeta débito',
    };

    const feed = [
      ...clients.map(c => ({
        id: `client-${c.id}`,
        type: 'client' as const,
        label: `${c.firstName} ${c.lastName}`,
        description: 'Nuevo cliente registrado',
        date: c.createdAt,
      })),
      ...memberships.map(m => ({
        id: `membership-${m.id}`,
        type: 'membership' as const,
        label: `${m.client.firstName} ${m.client.lastName}`,
        description: `Membresía ${typeLabels[m.type] ?? m.type} asignada`,
        date: m.createdAt,
      })),
      ...payments.map(p => ({
        id: `payment-${p.id}`,
        type: 'payment' as const,
        label: `₡${Number(p.amount).toLocaleString('es-CR')}`,
        description: `Pago recibido — ${methodLabels[p.method] ?? p.method}${p.membership?.client ? ` · ${p.membership.client.firstName} ${p.membership.client.lastName}` : ''}`,
        date: p.createdAt,
      })),
      ...routines.map(r => ({
        id: `routine-${r.id}`,
        type: 'routine' as const,
        label: r.name,
        description: 'Rutina actualizada',
        date: r.updatedAt,
      })),
    ];

    return feed
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
}
