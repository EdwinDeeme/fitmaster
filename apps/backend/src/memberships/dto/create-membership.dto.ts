import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsString, Min } from 'class-validator';
import { MembershipType } from '@prisma/client';

export class CreateMembershipDto {
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @IsEnum(MembershipType)
  type: MembershipType;

  @IsDateString()
  startDate: string;

  @IsDateString()
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
