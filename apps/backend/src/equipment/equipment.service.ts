import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto';
import { EQUIPMENT_CATALOG } from './equipment-catalog';
import { EquipmentStatus } from '@prisma/client';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  getCatalog() {
    return EQUIPMENT_CATALOG;
  }

  async getMaintenanceUsers(gymId: string) {
    return this.prisma.user.findMany({
      where: { gymId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  async create(gymId: string, dto: CreateEquipmentDto) {
    return this.prisma.equipment.create({
      data: {
        gymId,
        name: dto.name,
        brand: dto.brand,
        category: dto.category,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        maintenanceFrequencyDays: dto.maintenanceFrequencyDays,
        notes: dto.notes,
        status: 'OPERATIONAL',
      },
    });
  }

  async findAll(gymId: string) {
    return this.prisma.equipment.findMany({
      where: { gymId },
      include: {
        maintenanceRecords: { orderBy: { date: 'desc' }, take: 1 },
        _count: { select: { maintenanceRecords: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(gymId: string, id: string) {
    const eq = await this.prisma.equipment.findFirst({
      where: { id, gymId },
      include: { maintenanceRecords: { orderBy: { date: 'desc' } } },
    });
    if (!eq) throw new NotFoundException('Equipo no encontrado');
    return eq;
  }

  async update(gymId: string, id: string, dto: Partial<CreateEquipmentDto> & { status?: EquipmentStatus }) {
    await this.findOne(gymId, id);
    const data: any = { ...dto };
    if (dto.purchaseDate) data.purchaseDate = new Date(dto.purchaseDate);
    return this.prisma.equipment.update({ where: { id }, data });
  }

  async remove(gymId: string, id: string) {
    await this.findOne(gymId, id);
    return this.prisma.equipment.delete({ where: { id } });
  }

  async updateMaintenanceRecord(gymId: string, recordId: string, data: {
    type?: 'ROUTINE' | 'REPAIR' | 'REPLACEMENT';
    description?: string;
    cost?: number;
    performedBy?: string;
    performedByUserId?: string;
  }) {
    const record = await this.prisma.maintenanceRecord.findFirst({
      where: { id: recordId, gymId },
      include: { equipment: true },
    });
    if (!record) throw new NotFoundException('Registro no encontrado');

    // Only allow edits on the same calendar day
    const today = new Date();
    const recordDate = new Date(record.date);
    const sameDay =
      today.getFullYear() === recordDate.getFullYear() &&
      today.getMonth() === recordDate.getMonth() &&
      today.getDate() === recordDate.getDate();
    if (!sameDay) throw new Error('Solo se puede editar un registro el mismo día que fue creado');

    let resolvedPerformedBy = data.performedBy;
    if (data.performedByUserId) {
      const performer = await this.prisma.user.findFirst({
        where: { id: data.performedByUserId, gymId },
        select: { firstName: true, lastName: true },
      });
      if (!performer) {
        throw new NotFoundException('Usuario seleccionado para mantenimiento no encontrado');
      }
      resolvedPerformedBy = `${performer.firstName} ${performer.lastName}`.trim();
    }

    const updated = await this.prisma.maintenanceRecord.update({
      where: { id: recordId },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.description && { description: data.description }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(resolvedPerformedBy && { performedBy: resolvedPerformedBy }),
      },
    });

    // Sync the related expense (matched by description prefix + same date)
    const equipmentName = (record as any).equipment?.name ?? 'Equipo';
    const expenseDesc = `Mantenimiento: ${equipmentName} — ${data.description ?? record.description}`;
    const dayStart = new Date(recordDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(recordDate); dayEnd.setHours(23, 59, 59, 999);

    const existingExpense = await this.prisma.expense.findFirst({
      where: {
        gymId,
        category: 'MAINTENANCE',
        date: { gte: dayStart, lte: dayEnd },
        description: { contains: equipmentName },
      },
    });

    if (existingExpense) {
      await this.prisma.expense.update({
        where: { id: existingExpense.id },
        data: {
          description: expenseDesc,
          amount: data.cost ?? record.cost ?? 0,
          notes: `Realizado por: ${resolvedPerformedBy ?? record.performedBy}. Tipo: ${data.type ?? record.type}`,
        },
      });
    } else if (data.cost && data.cost > 0) {
      // Create expense if it didn't exist yet (e.g. original cost was 0)
      await this.prisma.expense.create({
        data: {
          gymId,
          description: expenseDesc,
          amount: data.cost,
          currency: 'CRC',
          category: 'MAINTENANCE',
          date: record.date,
          notes: `Realizado por: ${resolvedPerformedBy ?? record.performedBy}. Tipo: ${data.type ?? record.type}`,
        },
      });
    }

    return updated;
  }

  async addMaintenanceRecord(gymId: string, equipmentId: string, data: {
    type: 'ROUTINE' | 'REPAIR' | 'REPLACEMENT';
    description: string;
    cost?: number;
    performedByUserId: string;
  }) {
    await this.findOne(gymId, equipmentId);
    const now = new Date();
    const eq = await this.prisma.equipment.findUnique({ where: { id: equipmentId } });
    const performer = await this.prisma.user.findFirst({
      where: { id: data.performedByUserId, gymId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!performer) {
      throw new NotFoundException('Usuario seleccionado para mantenimiento no encontrado');
    }
    const performedBy = `${performer.firstName} ${performer.lastName}`.trim();

    const nextMaintenance = new Date(now);
    nextMaintenance.setDate(nextMaintenance.getDate() + (eq?.maintenanceFrequencyDays ?? 30));

    await this.prisma.equipment.update({
      where: { id: equipmentId },
      data: { lastMaintenance: now, nextMaintenance, status: 'OPERATIONAL' },
    });

    const record = await this.prisma.maintenanceRecord.create({
      data: { gymId, equipmentId, type: data.type, description: data.description, cost: data.cost, performedBy },
    });

    // Auto-create expense if cost > 0
    if (data.cost && data.cost > 0) {
      await this.prisma.expense.create({
        data: {
          gymId,
          description: `Mantenimiento: ${eq?.name ?? 'Equipo'} — ${data.description}`,
          amount: data.cost,
          currency: 'CRC',
          category: 'MAINTENANCE',
          date: now,
          notes: `Realizado por: ${performedBy} (${performer.email}). Tipo: ${data.type}`,
        },
      });
    }

    return record;
  }
}
