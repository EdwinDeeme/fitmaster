import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto/membership-plan.dto';

@Injectable()
export class MembershipPlansService {
  constructor(private prisma: PrismaService) {}

  create(gymId: string, dto: CreateMembershipPlanDto) {
    const isCombined = (dto.type as string) === 'COMBINED';
    return this.prisma.membershipPlan.create({
      data: {
        gymId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        price: isCombined ? 0 : dto.price,
        prices: isCombined ? (dto.prices as any) ?? {} : null,
      },
    });
  }

  async findAll(gymId: string) {
    const plans = await this.prisma.membershipPlan.findMany({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            memberships: {
              where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] } },
            },
          },
        },
      },
    });

    return plans.map(p => ({
      ...p,
      activeUsers: p._count.memberships,
    }));
  }

  async update(gymId: string, id: string, dto: UpdateMembershipPlanDto) {
    await this.findOne(gymId, id);
    const { prices, ...rest } = dto;
    return this.prisma.membershipPlan.update({
      where: { id },
      data: {
        ...rest,
        ...(prices !== undefined ? { prices: prices as any } : {}),
      },
    });
  }

  async remove(gymId: string, id: string) {
    await this.findOne(gymId, id);
    return this.prisma.membershipPlan.delete({ where: { id } });
  }

  private async findOne(gymId: string, id: string) {
    const plan = await this.prisma.membershipPlan.findFirst({ where: { id, gymId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    return plan;
  }
}
