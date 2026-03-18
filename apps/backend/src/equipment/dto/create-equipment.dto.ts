import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { EquipmentCategory } from '@prisma/client';

export class CreateEquipmentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsEnum(EquipmentCategory)
  category: EquipmentCategory;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsNumber()
  @Min(1)
  maintenanceFrequencyDays: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
