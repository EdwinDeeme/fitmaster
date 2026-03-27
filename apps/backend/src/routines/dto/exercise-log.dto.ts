import { IsString, IsNumber, IsOptional, IsDateString, Min, IsInt } from 'class-validator';

export class CreateExerciseLogDto {
  @IsString()
  exerciseName: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsInt()
  @Min(1)
  sets: number;

  @IsString()
  reps: string;

  @IsNumber()
  @Min(0)
  weightKg: number;

  @IsInt()
  @IsOptional()
  weekNumber?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
