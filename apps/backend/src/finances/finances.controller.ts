import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { CreatePaymentDto, CreateExpenseDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/interfaces';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('finances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  // Payments
  @Post('payments')
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST)
  createPayment(@CurrentUser() user: TokenPayload, @Body() dto: CreatePaymentDto) {
    return this.financesService.createPayment(user.gymId!, dto);
  }

  @Get('payments')
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST)
  findAllPayments(
    @CurrentUser() user: TokenPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.financesService.findAllPayments(user.gymId!, { startDate, endDate, clientId });
  }

  @Get('payments/:id')
  @Roles(UserRole.GYM_ADMIN, UserRole.RECEPTIONIST)
  getPayment(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.financesService.getPaymentById(user.gymId!, id);
  }

  @Delete('payments/:id')
  @Roles(UserRole.GYM_ADMIN)
  deletePayment(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.financesService.deletePayment(user.gymId!, id);
  }

  // Expenses
  @Post('expenses')
  @Roles(UserRole.GYM_ADMIN)
  createExpense(@CurrentUser() user: TokenPayload, @Body() dto: CreateExpenseDto) {
    return this.financesService.createExpense(user.gymId!, dto);
  }

  @Get('expenses')
  @Roles(UserRole.GYM_ADMIN)
  findAllExpenses(
    @CurrentUser() user: TokenPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financesService.findAllExpenses(user.gymId!, { startDate, endDate });
  }

  @Delete('expenses/:id')
  @Roles(UserRole.GYM_ADMIN)
  deleteExpense(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.financesService.deleteExpense(user.gymId!, id);
  }

  // Summary
  @Get('summary')
  @Roles(UserRole.GYM_ADMIN)
  getSummary(
    @CurrentUser() user: TokenPayload,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.financesService.getSummary(
      user.gymId!,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
  }
}
