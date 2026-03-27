import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  private buildMaintenanceMap(records: Array<{ performedBy: string }>) {
    const maintenanceBySignature = new Map<string, number>();
    for (const record of records) {
      const signature = record.performedBy.trim().toLowerCase();
      maintenanceBySignature.set(signature, (maintenanceBySignature.get(signature) || 0) + 1);
    }
    return maintenanceBySignature;
  }

  private withMetrics(
    members: Array<{
      id: string;
      email: string;
      role: UserRole;
      firstName: string;
      lastName: string;
      createdAt: Date;
    }>,
    routinesByUser: Map<string, number>,
    assignedClientsByTrainer: Map<string, Set<string>>,
    maintenanceBySignature: Map<string, number>,
    clientsByCreator: Map<string, number>,
  ) {
    return members.map((member) => {
      const fullName = `${member.firstName} ${member.lastName}`.trim().toLowerCase();
      const email = member.email.trim().toLowerCase();

      const maintenanceCount =
        (maintenanceBySignature.get(email) || 0) +
        (maintenanceBySignature.get(fullName) || 0);

      return {
        ...member,
        metrics: {
          routinesCreated: routinesByUser.get(member.id) || 0,
          activeAssignedClients: assignedClientsByTrainer.get(member.id)?.size || 0,
          maintenancePerformed: maintenanceCount,
          clientsCreated: clientsByCreator.get(member.id) || 0,
        },
      };
    });
  }

  async create(gymId: string, dto: CreateStaffDto) {
    if (dto.role === UserRole.GYM_ADMIN || dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Solo puedes crear entrenadores o recepcionistas');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Ya existe un usuario con ese email');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        gymId,
        email: dto.email,
        passwordHash,
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true },
    });
  }

  async findAll(gymId: string) {
    const staff = await this.prisma.user.findMany({
      where: {
        gymId,
        role: { in: [UserRole.GYM_ADMIN, UserRole.TRAINER, UserRole.RECEPTIONIST] },
      },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    if (staff.length === 0) {
      return staff;
    }

    const staffIds = staff.map((member) => member.id);
    const trainerIds = staff.filter((member) => member.role === UserRole.TRAINER).map((member) => member.id);

    const [routineCounts, activeAssignments, maintenanceRecords, clientCounts] = await Promise.all([
      this.prisma.routine.groupBy({
        by: ['createdBy'],
        where: { gymId, createdBy: { in: staffIds } },
        _count: { _all: true },
      }),
      trainerIds.length
        ? this.prisma.routineAssignment.findMany({
            where: { gymId, isActive: true, routine: { createdBy: { in: trainerIds } } },
            select: { clientId: true, routine: { select: { createdBy: true } } },
          })
        : Promise.resolve([]),
      this.prisma.maintenanceRecord.findMany({
        where: { gymId },
        select: { performedBy: true },
      }),
      this.prisma.$queryRaw<Array<{ createdByUserId: string; total: number }>>(Prisma.sql`
        SELECT created_by_user_id AS "createdByUserId", COUNT(*)::int AS total
        FROM clients
        WHERE gym_id = ${gymId}
          AND created_by_user_id IS NOT NULL
          AND created_by_user_id IN (${Prisma.join(staffIds)})
        GROUP BY created_by_user_id
      `),
    ]);

    const routinesByUser = new Map<string, number>();
    for (const row of routineCounts) {
      routinesByUser.set(row.createdBy, row._count._all);
    }

    const assignedClientsByTrainer = new Map<string, Set<string>>();
    for (const assignment of activeAssignments) {
      const trainerId = assignment.routine.createdBy;
      if (!assignedClientsByTrainer.has(trainerId)) {
        assignedClientsByTrainer.set(trainerId, new Set<string>());
      }
      assignedClientsByTrainer.get(trainerId)!.add(assignment.clientId);
    }

    const maintenanceBySignature = this.buildMaintenanceMap(maintenanceRecords);
    const clientsByCreator = new Map<string, number>();
    for (const row of clientCounts) {
      clientsByCreator.set(row.createdByUserId, row.total);
    }

    return this.withMetrics(staff, routinesByUser, assignedClientsByTrainer, maintenanceBySignature, clientsByCreator);
  }

  async findOne(gymId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, gymId },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const [routineCounts, activeAssignments, maintenanceRecords, recentRoutines, recentMaintenance, recentClients, clientsCreatedCount] = await Promise.all([
      this.prisma.routine.groupBy({
        by: ['createdBy'],
        where: { gymId, createdBy: user.id },
        _count: { _all: true },
      }),
      user.role === UserRole.TRAINER || user.role === UserRole.GYM_ADMIN
        ? this.prisma.routineAssignment.findMany({
            where: { gymId, isActive: true, routine: { createdBy: user.id } },
            select: { clientId: true },
          })
        : Promise.resolve([]),
      this.prisma.maintenanceRecord.findMany({
        where: { gymId },
        select: { performedBy: true },
      }),
      this.prisma.routine.findMany({
        where: { gymId, createdBy: user.id },
        select: {
          id: true,
          name: true,
          difficulty: true,
          targetGoal: true,
          createdAt: true,
          _count: { select: { assignments: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.maintenanceRecord.findMany({
        where: {
          gymId,
          OR: [
            { performedBy: { equals: user.email, mode: 'insensitive' } },
            {
              performedBy: {
                equals: `${user.firstName} ${user.lastName}`,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          date: true,
          type: true,
          description: true,
          cost: true,
          equipment: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      this.prisma.client.findMany({
        where: { gymId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          weight: true,
          height: true,
          bmi: true,
          dateOfBirth: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
        SELECT COUNT(*)::int AS total
        FROM clients
        WHERE gym_id = ${gymId}
          AND created_by_user_id = ${user.id}
      `),
    ]);

    const routinesByUser = new Map<string, number>();
    for (const row of routineCounts) {
      routinesByUser.set(row.createdBy, row._count._all);
    }

    const assignedSet = new Set<string>();
    for (const assignment of activeAssignments) {
      assignedSet.add(assignment.clientId);
    }

    const assignedClientsByTrainer = new Map<string, Set<string>>();
    assignedClientsByTrainer.set(user.id, assignedSet);
    const maintenanceBySignature = this.buildMaintenanceMap(maintenanceRecords);
    const clientsByCreator = new Map<string, number>();
    clientsByCreator.set(user.id, clientsCreatedCount[0]?.total ?? 0);

    const [memberWithMetrics] = this.withMetrics(
      [user],
      routinesByUser,
      assignedClientsByTrainer,
      maintenanceBySignature,
      clientsByCreator,
    );

    return {
      ...memberWithMetrics,
      activity: {
        routines: recentRoutines,
        maintenance: recentMaintenance,
        clients: recentClients,
      },
    };
  }

  async update(gymId: string, id: string, dto: Partial<Omit<CreateStaffDto, 'password'>>) {
    await this.findOne(gymId, id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true },
    });
  }

  async remove(gymId: string, id: string) {
    await this.findOne(gymId, id);
    return this.prisma.user.delete({ where: { id } });
  }

  async resetPassword(gymId: string, id: string, newPassword: string) {
    await this.findOne(gymId, id);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { message: 'Contraseña actualizada correctamente' };
  }
}
