import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { AssignRoutineDto } from './dto/assign-routine.dto';

@Injectable()
export class RoutinesService {
  constructor(private prisma: PrismaService) {}

  async create(gymId: string, userId: string, dto: CreateRoutineDto) {
    // Validate weeklySchedule has at least one day (Req 7.1)
    const days = Object.keys(dto.weeklySchedule || {});
    if (days.length === 0) {
      throw new BadRequestException('La rutina debe tener al menos un día de entrenamiento');
    }

    // Validate sets and reps for each exercise (Req 7.2, 7.3)
    for (const day of days) {
      const workoutDay = dto.weeklySchedule[day];
      for (const exercise of workoutDay.exercises) {
        if (exercise.sets < 1) {
          throw new BadRequestException(`El ejercicio "${exercise.name}" debe tener al menos 1 set`);
        }
        const reps = exercise.reps;
        if (typeof reps === 'number' && reps < 1) {
          throw new BadRequestException(`El ejercicio "${exercise.name}" debe tener al menos 1 rep`);
        }
        if (typeof reps === 'string') {
          const rangeMatch = reps.match(/^(\d+)-(\d+)$/);
          if (!rangeMatch || parseInt(rangeMatch[1]) < 1) {
            throw new BadRequestException(`El ejercicio "${exercise.name}" tiene un rango de reps inválido`);
          }
        }
      }
    }

    return this.prisma.routine.create({
      data: {
        gymId,
        name: dto.name,
        description: dto.description,
        targetGoal: dto.targetGoal as any,
        difficulty: dto.difficulty as any,
        durationWeeks: dto.durationWeeks,
        weeklySchedule: dto.weeklySchedule as any,
        createdBy: userId,
        isAIGenerated: false,
      },
    });
  }

  async findAll(gymId: string, filters?: { difficulty?: string; targetGoal?: string; search?: string }) {
    const where: any = { gymId };

    if (filters?.difficulty) where.difficulty = filters.difficulty;
    if (filters?.targetGoal) where.targetGoal = filters.targetGoal;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.routine.findMany({
      where,
      include: {
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(gymId: string, id: string) {
    const routine = await this.prisma.routine.findFirst({
      where: { id, gymId },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            client: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        _count: { select: { assignments: true } },
      },
    });

    if (!routine) throw new NotFoundException('Rutina no encontrada');
    return routine;
  }

  async update(gymId: string, id: string, dto: UpdateRoutineDto) {
    await this.findOne(gymId, id);

    if (dto.weeklySchedule) {
      const days = Object.keys(dto.weeklySchedule);
      if (days.length === 0) {
        throw new BadRequestException('La rutina debe tener al menos un día de entrenamiento');
      }
    }

    return this.prisma.routine.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.targetGoal && { targetGoal: dto.targetGoal as any }),
        ...(dto.difficulty && { difficulty: dto.difficulty as any }),
        ...(dto.durationWeeks && { durationWeeks: dto.durationWeeks }),
        ...(dto.weeklySchedule && { weeklySchedule: dto.weeklySchedule as any }),
      },
    });
  }

  async remove(gymId: string, id: string) {
    await this.findOne(gymId, id);
    await this.prisma.routine.delete({ where: { id } });
  }

  async assign(gymId: string, routineId: string, dto: AssignRoutineDto) {
    // Validate routine belongs to gym
    await this.findOne(gymId, routineId);

    // Validate client belongs to same gym (Req 7.4)
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, gymId },
    });
    if (!client) {
      throw new ForbiddenException('El cliente no pertenece a este gimnasio');
    }

    // Deactivate previous active assignment for this client
    await this.prisma.routineAssignment.updateMany({
      where: { gymId, clientId: dto.clientId, isActive: true },
      data: { isActive: false },
    });

    return this.prisma.routineAssignment.create({
      data: {
        gymId,
        routineId,
        clientId: dto.clientId,
        startDate: new Date(dto.startDate),
        isActive: true,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        routine: { select: { id: true, name: true, difficulty: true } },
      },
    });
  }

  async unassign(gymId: string, assignmentId: string) {
    const assignment = await this.prisma.routineAssignment.findFirst({
      where: { id: assignmentId, gymId },
    });
    if (!assignment) throw new NotFoundException('Asignación no encontrada');

    return this.prisma.routineAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false },
    });
  }

  async getClientRoutine(gymId: string, clientId: string) {
    // Validate client belongs to gym
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, gymId },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const assignment = await this.prisma.routineAssignment.findFirst({
      where: { gymId, clientId, isActive: true },
      include: { routine: true },
      orderBy: { assignedAt: 'desc' },
    });

    return assignment?.routine || null;
  }

  async getRecentRoutines(gymId: string, userId?: string, limit = 5) {
    const where: any = { gymId };
    
    // If userId provided (trainer), filter by their routines
    if (userId) {
      where.createdBy = userId;
    }

    return this.prisma.routine.findMany({
      where,
      include: {
        _count: { select: { assignments: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }
}
