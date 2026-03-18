import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto, CreateClientFullDto } from './dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(gymId: string, dto: CreateClientDto) {
    const existing = await this.prisma.client.findUnique({
      where: { gymId_email: { gymId, email: dto.email } },
    });
    if (existing) throw new ConflictException('Ya existe un cliente con ese email en este gimnasio');

    const weight = dto.weight;
    const height = dto.height / 100; // cm to m
    const bmi = parseFloat((weight / (height * height)).toFixed(2));

    return this.prisma.client.create({
      data: {
        gymId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        weight: dto.weight,
        height: dto.height,
        bmi,
        bodyFatPercentage: dto.bodyFatPercentage,
        goalType: dto.goalType,
        targetWeight: dto.targetWeight,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      },
    });
  }

  async findAll(gymId: string) {
    return this.prisma.client.findMany({
      where: { gymId },
      include: {
        memberships: {
          where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] } },
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
        _count: { select: { routineAssignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(gymId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, gymId },
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' },
          include: { payments: { orderBy: { createdAt: 'desc' } } },
        },
        physicalProgress: { orderBy: { date: 'desc' }, take: 10 },
        routineAssignments: {
          where: { isActive: true },
          include: { routine: { select: { id: true, name: true, difficulty: true, targetGoal: true } } },
        },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async update(gymId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(gymId, id);
    const data: any = { ...dto };
    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.targetDate) data.targetDate = new Date(dto.targetDate);
    if (dto.weight && dto.height) {
      const h = dto.height / 100;
      data.bmi = parseFloat((dto.weight / (h * h)).toFixed(2));
    }
    return this.prisma.client.update({ where: { id }, data });
  }

  async remove(gymId: string, id: string) {
    await this.findOne(gymId, id);
    return this.prisma.client.delete({ where: { id } });
  }

  async createFull(gymId: string, dto: CreateClientFullDto) {
    const existing = await this.prisma.client.findUnique({
      where: { gymId_email: { gymId, email: dto.email } },
    });
    if (existing) throw new ConflictException('Ya existe un cliente con ese email en este gimnasio');

    const h = dto.height / 100;
    const bmi = parseFloat((dto.weight / (h * h)).toFixed(2));

    return this.prisma.$transaction(async (tx) => {
      // 1. Create client
      const client = await tx.client.create({
        data: {
          gymId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          weight: dto.weight,
          height: dto.height,
          bmi,
          bodyFatPercentage: dto.bodyFatPercentage,
          goalType: dto.goalType,
          targetWeight: dto.targetWeight,
          targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        },
      });

      if (!dto.membership) return { client };

      // 2. Apply promotion if any
      let finalPrice = dto.membership.price;
      if (dto.membership.promotionCode) {
        const promo = await tx.promotion.findFirst({
          where: { gymId, code: dto.membership.promotionCode, isActive: true, endDate: { gte: new Date() } },
        });
        if (promo) {
          finalPrice = promo.discountType === 'PERCENTAGE'
            ? finalPrice * (1 - Number(promo.discountValue) / 100)
            : Math.max(0, finalPrice - Number(promo.discountValue));
          await tx.promotion.update({ where: { id: promo.id }, data: { currentUses: { increment: 1 } } });
        }
      }

      // 3. Create membership
      const membership = await tx.membership.create({
        data: {
          gymId,
          clientId: client.id,
          type: dto.membership.type,
          startDate: new Date(dto.membership.startDate),
          endDate: new Date(dto.membership.endDate),
          price: finalPrice,
          autoRenew: dto.membership.autoRenew ?? false,
          status: 'ACTIVE',
        },
      });

      if (!dto.payment) return { client, membership };

      // 4. Create payment
      const payment = await tx.payment.create({
        data: {
          gymId,
          clientId: client.id,
          membershipId: membership.id,
          amount: dto.payment.amount,
          currency: dto.payment.currency ?? 'CRC',
          method: dto.payment.method,
          status: 'COMPLETED',
          sinpeReference: dto.payment.sinpeReference,
          metadata: dto.payment.notes ? { notes: dto.payment.notes } : undefined,
        },
      });

      return { client, membership, payment };
    });
  }
}
