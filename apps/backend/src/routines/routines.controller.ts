import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto, UpdateRoutineDto, AssignRoutineDto, CreateExerciseLogDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('routines')
@ApiBearerAuth()
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  @Roles('GYM_ADMIN', 'TRAINER')
  @ApiOperation({ summary: 'Create a routine' })
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateRoutineDto,
  ) {
    return this.routinesService.create(user.gymId, user.userId, dto);
  }

  @Get()
  @Roles('GYM_ADMIN', 'TRAINER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'List all routines for the gym' })
  findAll(
    @CurrentUser() user: any,
    @Query('difficulty') difficulty?: string,
    @Query('targetGoal') targetGoal?: string,
    @Query('search') search?: string,
  ) {
    return this.routinesService.findAll(user.gymId, { difficulty, targetGoal, search });
  }

  @Get(':id')
  @Roles('GYM_ADMIN', 'TRAINER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get a routine by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.routinesService.findOne(user.gymId, id);
  }

  @Put(':id')
  @Roles('GYM_ADMIN', 'TRAINER')
  @ApiOperation({ summary: 'Update a routine' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateRoutineDto,
  ) {
    return this.routinesService.update(user.gymId, id, dto);
  }

  @Delete(':id')
  @Roles('GYM_ADMIN', 'TRAINER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a routine' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.routinesService.remove(user.gymId, id);
  }

  @Post(':id/assign')
  @Roles('GYM_ADMIN', 'TRAINER')
  @ApiOperation({ summary: 'Assign routine to a client' })
  assign(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AssignRoutineDto,
  ) {
    return this.routinesService.assign(user.gymId, id, dto);
  }

  @Delete('assignments/:assignmentId')
  @Roles('GYM_ADMIN', 'TRAINER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unassign a routine from a client' })
  unassign(@CurrentUser() user: any, @Param('assignmentId') assignmentId: string) {
    return this.routinesService.unassign(user.gymId, assignmentId);
  }

  @Get('client/:clientId')
  @Roles('GYM_ADMIN', 'TRAINER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get active routine for a client' })
  getClientRoutine(@CurrentUser() user: any, @Param('clientId') clientId: string) {
    return this.routinesService.getClientRoutine(user.gymId, clientId);
  }

  @Get('recent')
  @Roles('GYM_ADMIN', 'TRAINER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get recent routines' })
  getRecentRoutines(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    const userId = user.role === 'TRAINER' ? user.userId : undefined;
    return this.routinesService.getRecentRoutines(user.gymId, userId, limit ? parseInt(limit) : 5);
  }

  // ─── Exercise Logs ────────────────────────────────────────────────────────

  @Post('clients/:clientId/routines/:routineId/logs')
  @Roles('GYM_ADMIN', 'TRAINER', 'CLIENT')
  @ApiOperation({ summary: 'Log exercise weight for a client' })
  logExercise(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Param('routineId') routineId: string,
    @Body() dto: CreateExerciseLogDto,
  ) {
    return this.routinesService.logExercise(user.gymId, clientId, routineId, dto);
  }

  @Get('clients/:clientId/routines/:routineId/logs')
  @Roles('GYM_ADMIN', 'TRAINER', 'RECEPTIONIST', 'CLIENT')
  @ApiOperation({ summary: 'Get exercise logs grouped by exercise name' })
  getExerciseLogs(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Param('routineId') routineId: string,
  ) {
    return this.routinesService.getExerciseLogs(user.gymId, clientId, routineId);
  }

  @Get('clients/:clientId/logs')
  @Roles('GYM_ADMIN', 'TRAINER', 'RECEPTIONIST', 'CLIENT')
  @ApiOperation({ summary: 'Get all exercise logs for a client' })
  getExerciseLogsByClient(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
  ) {
    return this.routinesService.getExerciseLogsByClient(user.gymId, clientId);
  }
}
