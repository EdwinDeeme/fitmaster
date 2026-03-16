import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipDto } from './dto';
import { MembershipStatus } from '@prisma/client';

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async create(gymId: string, dto: CreateMembershipDto) {
    const client = await this.prisma.client.findFirst({ where: { id: dto.clientId, gymId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    let finalPrice = dto.price;
    if (dto.promotionCode) {
      const promo = await this.prisma.promotion.findFirst({
        where: { gymId, code: dto.promotionCode, isActive: true, endDate: { gte: new Date() } },
      });
      if (promo) {
        if (promo.discountType === 'PERCENTAGE') {
          finalPrice = finalPrice * (1 - Number(promo.discountValue) / 100);
        } else {
          finalPrice = Math.max(0, finalPrice - Number(promo.discountValue));
        }
        await this.prisma.promotion.update({
          where: { id: promo.id },
          data: { currentUses: { increment: 1 } },
        });
      }
    }

    return this.prisma.membership.create({
      data: {
        gymId,
        clientId: dto.clientId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        price: finalPrice,
        autoRenew: dto.autoRenew ?? false,
        status: 'ACTIVE',
      },
      include: { client: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  async findAll(gymId: string) {
    return this.prisma.membership.findMany({
      where: { gymId },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(gymId: string, id: string) {
    const m = await this.prisma.membership.findFirst({
      where: { id, gymId },
      include: {
        client: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!m) throw new NotFoundException('Membresía no encontrada');
    return m;
  }

  async updateStatus(gymId: string, id: string, status: MembershipStatus) {
    await this.findOne(gymId, id);
    return this.prisma.membership.update({ where: { id }, data: { status } });
  }

  async getStats(gymId: string) {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [active, expiringSoon, expired, total] = await Promise.all([
      this.prisma.membership.count({ where: { gymId, status: 'ACTIVE' } }),
      this.prisma.membership.count({ where: { gymId, status: 'ACTIVE', endDate: { lte: nextWeek, gte: now } } }),
      this.prisma.membership.count({ where: { gymId, status: 'EXPIRED' } }),
      this.prisma.membership.count({ where: { gymId } }),
    ]);

    return { active, expiringSoon, expired, total };
  }
}
