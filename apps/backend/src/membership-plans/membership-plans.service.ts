import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto/membership-plan.dto';

@Injectable()
export class MembershipPlansService {
  constructor(private prisma: PrismaService) {}

  create(gymId: string, dto: CreateMembershipPlanDto) {
    return this.prisma.membershipPlan.create({
      data: { gymId, ...dto, price: dto.price },
    });
  }

  findAll(gymId: string) {
    return this.prisma.membershipPlan.findMany({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(gymId: string, id: string, dto: UpdateMembershipPlanDto) {
    await this.findOne(gymId, id);
    return this.prisma.membershipPlan.update({ where: { id }, data: dto });
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
