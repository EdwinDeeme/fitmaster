import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MembershipType } from '@prisma/client';

export class CombinedPricesDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quarterly?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  annual?: number;
}

export class CreateMembershipPlanDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(MembershipType)
  type: MembershipType;

  // Required for non-COMBINED types
  @ValidateIf(o => o.type !== 'COMBINED')
  @IsNumber()
  @Min(0)
  price: number;

  // Required for COMBINED type
  @ValidateIf(o => o.type === 'COMBINED')
  @ValidateNested()
  @Type(() => CombinedPricesDto)
  prices?: CombinedPricesDto;
}

export class UpdateMembershipPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MembershipType)
  type?: MembershipType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CombinedPricesDto)
  prices?: CombinedPricesDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
