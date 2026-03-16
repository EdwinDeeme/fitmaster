import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('equipment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get('catalog')
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER)
  getCatalog() {
    return this.equipmentService.getCatalog();
  }

  @Post()
  @Roles(UserRole.GYM_ADMIN)
  create(@CurrentUser() user: TokenPayload, @Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(user.gymId!, dto);
  }

  @Get()
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER)
  findAll(@CurrentUser() user: TokenPayload) {
    return this.equipmentService.findAll(user.gymId!);
  }

  @Get(':id')
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER)
  findOne(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.equipmentService.findOne(user.gymId!, id);
  }

  @Patch(':id')
  @Roles(UserRole.GYM_ADMIN)
  update(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body() dto: any) {
    return this.equipmentService.update(user.gymId!, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.GYM_ADMIN)
  remove(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.equipmentService.remove(user.gymId!, id);
  }

  @Post(':id/maintenance')
  @Roles(UserRole.GYM_ADMIN)
  addMaintenance(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body() data: any) {
    return this.equipmentService.addMaintenanceRecord(user.gymId!, id, data);
  }
}
