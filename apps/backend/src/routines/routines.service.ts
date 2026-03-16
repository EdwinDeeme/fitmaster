import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutineDto, AssignRoutineDto } from './dto';

@Injectable()
export class RoutinesService {
  constructor(private prisma: PrismaService) {}

  async create(gymId: string, createdBy: string, dto: CreateRoutineDto) {
    return this.prisma.routine.create({
      data: {
        gymId,
        createdBy,
        name: dto.name,
        description: dto.description,
        targetGoal: dto.targetGoal,
        difficulty: dto.difficulty,
        durationWeeks: dto.durationWeeks,
        weeklySchedule: dto.weeklySchedule ?? {},
        isAIGenerated: false,
      },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, role: true } },
        _count: { select: { assignments: true } },
      },
    });
  }

  async findAll(gymId: string) {
    return this.prisma.routine.findMany({
      where: { gymId },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, role: true } },
        assignments: {
          where: { isActive: true },
          include: { client: { select: { id: true, firstName: true, lastName: true } } },
        },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(gymId: string, id: string) {
    const routine = await this.prisma.routine.findFirst({
      where: { id, gymId },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, role: true } },
        assignments: {
          include: { client: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });
    if (!routine) throw new NotFoundException('Rutina no encontrada');
    return routine;
  }

  async update(gymId: string, id: string, dto: Partial<CreateRoutineDto>) {
    await this.findOne(gymId, id);
    return this.prisma.routine.update({ where: { id }, data: dto });
  }

  async remove(gymId: string, id: string) {
    await this.findOne(gymId, id);
    return this.prisma.routine.delete({ where: { id } });
  }

  async assign(gymId: string, dto: AssignRoutineDto) {
    const [routine, client] = await Promise.all([
      this.prisma.routine.findFirst({ where: { id: dto.routineId, gymId } }),
      this.prisma.client.findFirst({ where: { id: dto.clientId, gymId } }),
    ]);
    if (!routine) throw new NotFoundException('Rutina no encontrada');
    if (!client) throw new NotFoundException('Cliente no encontrado');

    // Deactivate previous active assignment for this client
    await this.prisma.routineAssignment.updateMany({
      where: { gymId, clientId: dto.clientId, isActive: true },
      data: { isActive: false },
    });

    return this.prisma.routineAssignment.create({
      data: {
        gymId,
        routineId: dto.routineId,
        clientId: dto.clientId,
        startDate: new Date(dto.startDate),
        isActive: true,
      },
      include: {
        routine: { select: { name: true, difficulty: true } },
        client: { select: { firstName: true, lastName: true } },
      },
    });
  }
}
