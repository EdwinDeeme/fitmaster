import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto, CreateClientFullDto, CreateProgressDto, UpdateGoalDto } from './dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

function generateTempPassword(): string {
  // e.g. Fit#4829
  const num = crypto.randomInt(1000, 9999);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const letter = chars[crypto.randomInt(0, chars.length)];
  return `Fit${letter}${num}`;
}

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(gymId: string, userId: string, dto: CreateClientDto) {
    const existing = await this.prisma.client.findUnique({
      where: { gymId_email: { gymId, email: dto.email } },
    });
    if (existing) throw new ConflictException('Ya existe un cliente con ese email en este gimnasio');

    const weight = dto.weight;
    const height = dto.height / 100;
    const bmi = parseFloat((weight / (height * height)).toFixed(2));

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create or update User account with new temp password
    const existingUser = await this.prisma.user.upsert({
      where: { email: dto.email },
      create: {
        gymId,
        email: dto.email,
        passwordHash,
        role: 'CLIENT',
        firstName: dto.firstName,
        lastName: dto.lastName,
        mustChangePassword: true,
      },
      update: {
        passwordHash,
        mustChangePassword: true,
      },
    });
    const clientUserId = existingUser.id;

    return this.prisma.client.create({
      data: {
        gymId,
        userId: clientUserId,
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
        tempPassword,
        mustChangePassword: true,
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

  async findByEmail(email: string, gymId: string) {
    const client = await this.prisma.client.findFirst({
      where: { email, gymId },
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' },
          include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
        physicalProgress: { orderBy: { date: 'desc' }, take: 10 },
        routineAssignments: {
          where: { isActive: true },
          include: { routine: true },
        },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
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
    const client = await this.findOne(gymId, id);
    await this.prisma.client.delete({ where: { id } });
    // Also remove the linked User account if it exists
    if (client.email) {
      await this.prisma.user.deleteMany({ where: { email: client.email, role: 'CLIENT' } });
    }
    return client;
  }

  // ─── Physical Progress ────────────────────────────────────────────────────

  async addProgress(gymId: string, clientId: string, dto: CreateProgressDto) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, gymId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const progress = await this.prisma.physicalProgress.create({
      data: {
        gymId,
        clientId,
        date: dto.date ? new Date(dto.date) : new Date(),
        weight: dto.weight,
        bodyFatPercentage: dto.bodyFatPercentage,
        measurements: dto.measurements ?? undefined,
        notes: dto.notes,
      },
    });

    // Update client's current weight
    await this.prisma.client.update({
      where: { id: clientId },
      data: { weight: dto.weight, bodyFatPercentage: dto.bodyFatPercentage },
    });

    return progress;
  }

  async getProgress(gymId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, gymId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.physicalProgress.findMany({
      where: { gymId, clientId },
      orderBy: { date: 'asc' },
    });
  }

  async updateGoal(gymId: string, clientId: string, dto: UpdateGoalDto) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, gymId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.client.update({
      where: { id: clientId },
      data: {
        targetWeight: dto.targetWeight,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      },
    });
  }

  async createFull(gymId: string, userId: string, dto: CreateClientFullDto) {
    const existing = await this.prisma.client.findUnique({
      where: { gymId_email: { gymId, email: dto.email } },
    });
    if (existing) throw new ConflictException('Ya existe un cliente con ese email en este gimnasio');

    const h = dto.height / 100;
    const bmi = parseFloat((dto.weight / (h * h)).toFixed(2));

    return this.prisma.$transaction(async (tx) => {
      const tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      // Create or update User account with new temp password
      const user = await tx.user.upsert({
        where: { email: dto.email },
        create: {
          gymId,
          email: dto.email,
          passwordHash,
          role: 'CLIENT',
          firstName: dto.firstName,
          lastName: dto.lastName,
          mustChangePassword: true,
        },
        update: {
          passwordHash,
          mustChangePassword: true,
        },
      });
      const clientUserId = user.id;

      // 1. Create client
      const client = await tx.client.create({
        data: {
          gymId,
          userId: clientUserId,
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
          tempPassword,
          mustChangePassword: true,
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
