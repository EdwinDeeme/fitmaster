import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
  ArrayMinSize,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExerciseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  sets: number;

  @ApiProperty({ description: 'Reps as number or range string like "8-12"' })
  @IsNotEmpty()
  reps: number | string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  restSeconds: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  muscleGroups?: string[];
}

export class WorkoutDayDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: [ExerciseDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];
}

export class CreateRoutineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'STRENGTH', 'ENDURANCE'] })
  @IsEnum(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'STRENGTH', 'ENDURANCE'])
  targetGoal: string;

  @ApiProperty({ enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] })
  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  difficulty: string;

  @ApiProperty({ minimum: 1, maximum: 52 })
  @IsInt()
  @Min(1)
  @Max(52)
  durationWeeks: number;

  @ApiProperty({ description: 'Weekly schedule as object with day keys' })
  @IsObject()
  @IsNotEmpty()
  weeklySchedule: Record<string, WorkoutDayDto>;
}
