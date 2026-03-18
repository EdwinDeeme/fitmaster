import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces';
import { UserRole, MembershipStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IsEnum } from 'class-validator';

class UpdateStatusDto {
  @IsEnum(MembershipStatus)
  status: MembershipStatus;
}

@Controller('memberships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST)
  create(@CurrentUser() user: TokenPayload, @Body() dto: CreateMembershipDto) {
    return this.membershipsService.create(user.gymId!, dto);
  }

  @Get()
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST)
  findAll(@CurrentUser() user: TokenPayload) {
    return this.membershipsService.findAll(user.gymId!);
  }

  @Get('stats')
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST)
  getStats(@CurrentUser() user: TokenPayload) {
    return this.membershipsService.getStats(user.gymId!);
  }

  @Get(':id')
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST)
  findOne(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.membershipsService.findOne(user.gymId!, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST)
  updateStatus(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.membershipsService.updateStatus(user.gymId!, id, dto.status);
  }
}
