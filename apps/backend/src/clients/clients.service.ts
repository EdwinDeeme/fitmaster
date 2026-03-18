import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto';

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
}
