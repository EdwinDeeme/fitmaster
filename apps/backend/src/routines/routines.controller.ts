import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto, AssignRoutineDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('routines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER)
  create(@CurrentUser() user: TokenPayload, @Body() dto: CreateRoutineDto) {
    return this.routinesService.create(user.gymId!, user.userId, dto);
  }

  @Get()
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER)
  findAll(@CurrentUser() user: TokenPayload) {
    return this.routinesService.findAll(user.gymId!);
  }

  @Get(':id')
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER)
  findOne(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.routinesService.findOne(user.gymId!, id);
  }

  @Patch(':id')
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER)
  update(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body() dto: Partial<CreateRoutineDto>) {
    return this.routinesService.update(user.gymId!, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.GYM_ADMIN)
  remove(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.routinesService.remove(user.gymId!, id);
  }

  @Post('assign')
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER)
  assign(@CurrentUser() user: TokenPayload, @Body() dto: AssignRoutineDto) {
    return this.routinesService.assign(user.gymId!, dto);
  }
}
