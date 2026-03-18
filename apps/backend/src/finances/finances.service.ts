import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, CreateExpenseDto } from './dto';

@Injectable()
export class FinancesService {
  constructor(private prisma: PrismaService) {}

  // ─── PAYMENTS ───────────────────────────────────────────────────────────────

  async createPayment(gymId: string, dto: CreatePaymentDto) {
    if (dto.membershipId) {
      const membership = await this.prisma.membership.findFirst({
        where: { id: dto.membershipId, gymId },
      });
      if (!membership) throw new NotFoundException('Membresía no encontrada');
    }

    return this.prisma.payment.create({
      data: {
        gymId,
        clientId: dto.clientId ?? null,
        membershipId: dto.membershipId ?? null,
        amount: dto.amount,
        currency: dto.currency ?? 'CRC',
        method: dto.method,
        status: 'COMPLETED',
        sinpeReference: dto.sinpeReference ?? null,
        metadata: {
          ...(dto.notes ? { notes: dto.notes } : {}),
          ...(dto.description ? { description: dto.description } : {}),
        },
      },
      include: {
        client: { select: { firstName: true, lastName: true, email: true } },
        membership: {
          include: { client: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });
  }

  async findAllPayments(gymId: string, filters?: { startDate?: string; endDate?: string; clientId?: string }) {
    const where: any = { gymId };
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        membership: {
          include: { client: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentById(gymId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, gymId },
      include: {
        membership: {
          include: { client: true },
        },
      },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return payment;
  }

  async deletePayment(gymId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id, gymId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return this.prisma.payment.delete({ where: { id } });
  }

  // ─── EXPENSES ────────────────────────────────────────────────────────────────

  async createExpense(gymId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        gymId,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency ?? 'CRC',
        category: dto.category,
        date: new Date(dto.date),
        notes: dto.notes,
      },
    });
  }

  async findAllExpenses(gymId: string, filters?: { startDate?: string; endDate?: string }) {
    const where: any = { gymId };
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }
    return this.prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
  }

  async deleteExpense(gymId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({ where: { id, gymId } });
    if (!expense) throw new NotFoundException('Egreso no encontrado');
    return this.prisma.expense.delete({ where: { id } });
  }

  // ─── SUMMARY ─────────────────────────────────────────────────────────────────

  async getSummary(gymId: string, month?: number, year?: number) {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const [incomeAgg, expenseAgg, payments, expenses] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { gymId, status: 'COMPLETED', createdAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { gymId, date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      this.prisma.payment.findMany({
        where: { gymId, status: 'COMPLETED', createdAt: { gte: startDate, lte: endDate } },
        include: {
          client: { select: { firstName: true, lastName: true } },
          membership: { include: { client: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expense.findMany({
        where: { gymId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'desc' },
      }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount ?? 0);
    const totalExpenses = Number(expenseAgg._sum.amount ?? 0);

    return {
      month: m,
      year: y,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      payments,
      expenses,
    };
  }
}
