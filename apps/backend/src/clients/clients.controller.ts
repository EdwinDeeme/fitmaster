import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto, CreateClientFullDto, CreateProgressDto, UpdateGoalDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('me')
  @Roles(UserRole.CLIENT)
  getMe(@CurrentUser() user: TokenPayload) {
    return this.clientsService.findByEmail(user.email, user.gymId!);
  }

  @Post()
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST)
  create(@CurrentUser() user: TokenPayload, @Body() dto: CreateClientDto) {
    return this.clientsService.create(user.gymId!, user.userId, dto);
  }

  @Post('with-membership')
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST)
  createFull(@CurrentUser() user: TokenPayload, @Body() dto: CreateClientFullDto) {
    return this.clientsService.createFull(user.gymId!, user.userId, dto);
  }

  @Get()
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER, UserRole.RECEPTIONIST)
  findAll(@CurrentUser() user: TokenPayload) {
    return this.clientsService.findAll(user.gymId!);
  }

  @Get(':id')
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER, UserRole.RECEPTIONIST)
  findOne(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.clientsService.findOne(user.gymId!, id);
  }

  @Patch(':id')
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST)
  update(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(user.gymId!, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.GYM_ADMIN)
  remove(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.clientsService.remove(user.gymId!, id);
  }

  @Post(':id/progress')
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER, UserRole.CLIENT)
  addProgress(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body() dto: CreateProgressDto) {
    return this.clientsService.addProgress(user.gymId!, id, dto);
  }

  @Get(':id/progress')
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER, UserRole.RECEPTIONIST)
  getProgress(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.clientsService.getProgress(user.gymId!, id);
  }

  @Patch(':id/goal')
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER)
  updateGoal(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return this.clientsService.updateGoal(user.gymId!, id, dto);
  }
}
