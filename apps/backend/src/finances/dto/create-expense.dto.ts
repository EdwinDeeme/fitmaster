import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum ExpenseCategory {
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  EQUIPMENT = 'EQUIPMENT',
  SALARIES = 'SALARIES',
  MAINTENANCE = 'MAINTENANCE',
  MARKETING = 'MARKETING',
  SUPPLIES = 'SUPPLIES',
  OTHER = 'OTHER',
}

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
