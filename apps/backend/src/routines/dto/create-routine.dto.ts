import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsString, IsArray, Min } from 'class-validator';
import { GoalType, DifficultyLevel } from '@prisma/client';

export class CreateRoutineDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(GoalType)
  targetGoal: GoalType;

  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @IsNumber()
  @Min(1)
  durationWeeks: number;

  weeklySchedule: any; // JSON flexible
}

export class AssignRoutineDto {
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @IsNotEmpty()
  @IsString()
  routineId: string;

  @IsNotEmpty()
  @IsString()
  startDate: string;
}
