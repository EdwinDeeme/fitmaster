import { IsString, IsNotEmpty, IsDateString, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPlanDto {
  @ApiProperty({ example: 'plan-pro-001' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ example: '2024-03-13T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2024-04-13T00:00:00.000Z', required: false })
  @ValidateIf((o) => o.trialEndDate !== '' && o.trialEndDate !== null && o.trialEndDate !== undefined)
  @IsDateString()
  @IsOptional()
  trialEndDate?: string;
}
