import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { Gender, GoalType } from '@prisma/client';

export class CreateClientDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsDateString()
  dateOfBirth: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsNumber()
  @Min(0)
  weight: number;

  @IsNumber()
  @Min(0)
  height: number;

  @IsOptional()
  @IsNumber()
  bodyFatPercentage?: number;

  @IsEnum(GoalType)
  goalType: GoalType;

  @IsOptional()
  @IsNumber()
  targetWeight?: number;

  @IsOptional()
  @IsDateString()
  targetDate?: string;
}
