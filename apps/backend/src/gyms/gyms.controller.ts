import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GymsService } from './gyms.service';
import { CreateGymDto, UpdateGymDto, AssignPlanDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('gyms')
@Controller('gyms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Create a new gym manually (SUPER_ADMIN only - for testing/support)',
    description: 'Normally gyms are created automatically through the payment flow'
  })
  create(@Body() createGymDto: CreateGymDto) {
    return this.gymsService.create(createGymDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all gyms (SUPER_ADMIN only)' })
  findAll() {
    return this.gymsService.findAll();
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get gym statistics (SUPER_ADMIN only)' })
  getStats() {
    return this.gymsService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a gym by ID (SUPER_ADMIN only)' })
  findOne(@Param('id') id: string) {
    return this.gymsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Update a gym (SUPER_ADMIN only)',
    description: 'Update gym details, status (suspend/activate), or settings'
  })
  update(@Param('id') id: string, @Body() updateGymDto: UpdateGymDto) {
    return this.gymsService.update(id, updateGymDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Delete a gym (SUPER_ADMIN only - USE WITH CAUTION)',
    description: 'Permanently deletes a gym and all its data. Consider suspending instead.'
  })
  remove(@Param('id') id: string) {
    return this.gymsService.remove(id);
  }

  @Post(':id/assign-plan')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign a plan to a gym (SUPER_ADMIN only)' })
  assignPlan(@Param('id') id: string, @Body() assignPlanDto: AssignPlanDto) {
    return this.gymsService.assignPlan(id, assignPlanDto);
  }
}
