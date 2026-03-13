import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GymsService } from './gyms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('gyms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll() {
    return this.gymsService.findAll();
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN)
  getStats() {
    return this.gymsService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.gymsService.findOne(id);
  }
}
