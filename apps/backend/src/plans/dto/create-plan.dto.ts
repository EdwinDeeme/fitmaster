import { IsString, IsNumber, IsBoolean, IsEnum, IsOptional, IsArray, IsObject, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanInterval } from '@prisma/client';

export class CreatePlanDto {
  @ApiProperty({ example: 'Plan Profesional' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Ideal para gimnasios en crecimiento', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'CRC', default: 'CRC' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ enum: PlanInterval, example: PlanInterval.MONTHLY })
  @IsEnum(PlanInterval)
  interval: PlanInterval;

  @ApiProperty({ 
    example: ['Hasta 500 clientes', 'Rutinas con IA', 'Soporte prioritario'],
    type: [String]
  })
  @IsArray()
  features: string[];

  @ApiProperty({ 
    example: { maxClients: 500, maxStaff: 10, aiRoutines: true },
    description: 'Límites y características del plan'
  })
  @IsObject()
  limits: Record<string, any>;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @ApiProperty({ example: 1, default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
