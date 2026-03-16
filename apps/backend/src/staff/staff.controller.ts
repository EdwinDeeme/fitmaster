import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IsString, MinLength } from 'class-validator';

class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword: string;
}

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.GYM_ADMIN)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  create(@CurrentUser() user: TokenPayload, @Body() dto: CreateStaffDto) {
    return this.staffService.create(user.gymId!, dto);
  }

  @Get()
  findAll(@CurrentUser() user: TokenPayload) {
    return this.staffService.findAll(user.gymId!);
  }

  @Get(':id')
  findOne(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.staffService.findOne(user.gymId!, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body() dto: any) {
    return this.staffService.update(user.gymId!, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.staffService.remove(user.gymId!, id);
  }

  @Post(':id/reset-password')
  resetPassword(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.staffService.resetPassword(user.gymId!, id, dto.newPassword);
  }
}
