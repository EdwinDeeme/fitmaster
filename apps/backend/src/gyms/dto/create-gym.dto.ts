import { IsString, IsNotEmpty, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GymStatus } from '@prisma/client';

export class CreateGymDto {
  @ApiProperty({ example: 'PowerFit Gym' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'powerfit' })
  @IsString()
  @IsNotEmpty()
  subdomain: string;

  @ApiProperty({ example: 'CR', default: 'CR' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 'America/Costa_Rica', default: 'America/Costa_Rica' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ 
    example: { theme: 'light', notifications: true },
    required: false 
  })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiProperty({ enum: GymStatus, default: GymStatus.TRIAL })
  @IsEnum(GymStatus)
  @IsOptional()
  status?: GymStatus;
}
