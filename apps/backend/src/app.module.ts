import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { GymIsolationGuard } from './auth/guards/gym-isolation.guard';
import { GymsModule } from './gyms/gyms.module';
import { DashboardService } from './dashboard/dashboard.service';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Prisma
    PrismaModule,

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '1000'),
      },
    ]),

    // Authentication
    AuthModule,

    GymsModule,

    DashboardModule,

    // Feature modules will be added here
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Reflector,
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: GymIsolationGuard,
    },
    DashboardService,
  ],
})
export class AppModule {}
