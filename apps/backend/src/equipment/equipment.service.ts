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

  async addMaintenanceRecord(gymId: string, equipmentId: string, data: {
    type: 'ROUTINE' | 'REPAIR' | 'REPLACEMENT';
    description: string;
    cost?: number;
    performedBy: string;
  }) {
    await this.findOne(gymId, equipmentId);
    const now = new Date();
    const eq = await this.prisma.equipment.findUnique({ where: { id: equipmentId } });
    const nextMaintenance = new Date(now);
    nextMaintenance.setDate(nextMaintenance.getDate() + (eq?.maintenanceFrequencyDays ?? 30));

    await this.prisma.equipment.update({
      where: { id: equipmentId },
      data: { lastMaintenance: now, nextMaintenance, status: 'OPERATIONAL' },
    });

    return this.prisma.maintenanceRecord.create({
      data: { gymId, equipmentId, type: data.type, description: data.description, cost: data.cost, performedBy: data.performedBy },
    });
  }
}
