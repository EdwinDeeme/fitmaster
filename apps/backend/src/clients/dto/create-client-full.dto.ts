import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { MembershipType, PaymentMethod } from '@prisma/client';
import { CreateClientDto } from './create-client.dto';

export class MembershipDataDto {
  @IsOptional()
  @IsString()
  membershipPlanId?: string;

  @IsEnum(MembershipType)
  type: MembershipType;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsString()
  promotionCode?: string;
}

export class PaymentDataDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  sinpeReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateClientFullDto extends CreateClientDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => MembershipDataDto)
  membership?: MembershipDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDataDto)
  payment?: PaymentDataDto;
}
