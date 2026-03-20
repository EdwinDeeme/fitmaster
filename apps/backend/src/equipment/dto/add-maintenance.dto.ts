import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddMaintenanceDto {
  @IsEnum(['ROUTINE', 'REPAIR', 'REPLACEMENT'])
  type: 'ROUTINE' | 'REPAIR' | 'REPLACEMENT';

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsUUID()
  performedByUserId: string;
}
