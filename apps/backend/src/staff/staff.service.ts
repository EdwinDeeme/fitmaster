import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.user.findMany({
      where: { gymId, role: { in: [UserRole.TRAINER, UserRole.RECEPTIONIST] } },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(gymId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, gymId },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
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
