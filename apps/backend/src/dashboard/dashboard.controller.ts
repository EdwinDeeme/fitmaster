import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GymIsolationGuard } from '../auth/guards/gym-isolation.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces';
import { UserRole } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, GymIsolationGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST)
  getGymMetrics(@CurrentUser() user: TokenPayload) {
    return this.dashboardService.getGymMetrics(user.gymId);
  }

  @Get('trainer-metrics')
  @Roles(UserRole.TRAINER)
  getTrainerMetrics(@CurrentUser() user: TokenPayload) {
    return this.dashboardService.getTrainerMetrics(user.gymId, user.userId);
  }
}
