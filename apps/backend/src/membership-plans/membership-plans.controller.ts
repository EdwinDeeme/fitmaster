import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MembershipPlansService } from './membership-plans.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto/membership-plan.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('membership-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembershipPlansController {
  constructor(private readonly service: MembershipPlansService) {}

  @Post()
  @Roles(UserRole.GYM_ADMIN)
  create(@CurrentUser() user: TokenPayload, @Body() dto: CreateMembershipPlanDto) {
    return this.service.create(user.gymId!, dto);
  }

  @Get()
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST, UserRole.TRAINER)
  findAll(@CurrentUser() user: TokenPayload) {
    return this.service.findAll(user.gymId!);
  }

  @Patch(':id')
  @Roles(UserRole.GYM_ADMIN)
  update(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body() dto: UpdateMembershipPlanDto) {
    return this.service.update(user.gymId!, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.GYM_ADMIN)
  remove(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.service.remove(user.gymId!, id);
  }
}
