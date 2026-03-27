import { IsNumber, IsOptional, IsString, IsDateString, Min, Max } from 'class-validator';

export class CreateProgressDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @Min(20)
  @Max(500)
  weight: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(70)
  bodyFatPercentage?: number;

  @IsOptional()
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateGoalDto {
  @IsNumber()
  @IsOptional()
  targetWeight?: number;

  @IsDateString()
  @IsOptional()
  targetDate?: string;
}
