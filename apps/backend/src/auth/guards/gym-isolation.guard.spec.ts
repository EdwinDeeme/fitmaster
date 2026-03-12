import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GymIsolationGuard } from './gym-isolation.guard';
import { UserRole } from '@prisma/client';
import { TokenPayload } from '../interfaces';

describe('GymIsolationGuard', () => {
  let guard: GymIsolationGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new GymIsolationGuard(reflector);
  });

  const createMockExecutionContext = (
    user: TokenPayload | null,
    gymIdInRequest?: string,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: gymIdInRequest ? { gymId: gymIdInRequest } : {},
          query: {},
          body: {},
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw ForbiddenException if user is not authenticated', () => {
    const context = createMockExecutionContext(null);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow SUPER_ADMIN to access any gym', () => {
    const user: TokenPayload = {
      userId: 'user-123',
      gymId: 'gym-123',
      role: UserRole.SUPER_ADMIN,
      email: 'superadmin@example.com',
    };

    const context = createMockExecutionContext(user, 'gym-456');
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if gymId matches user gymId', () => {
    const user: TokenPayload = {
      userId: 'user-123',
      gymId: 'gym-123',
      role: UserRole.GYM_ADMIN,
      email: 'admin@example.com',
    };

    const context = createMockExecutionContext(user, 'gym-123');
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if gymId does not match user gymId', () => {
    const user: TokenPayload = {
      userId: 'user-123',
      gymId: 'gym-123',
      role: UserRole.GYM_ADMIN,
      email: 'admin@example.com',
    };

    const context = createMockExecutionContext(user, 'gym-456');
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if no gymId in request', () => {
    const user: TokenPayload = {
      userId: 'user-123',
      gymId: 'gym-123',
      role: UserRole.TRAINER,
      email: 'trainer@example.com',
    };

    const context = createMockExecutionContext(user);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should check gymId from query params', () => {
    const user: TokenPayload = {
      userId: 'user-123',
      gymId: 'gym-123',
      role: UserRole.TRAINER,
      email: 'trainer@example.com',
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: {},
          query: { gymId: 'gym-456' },
          body: {},
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should check gymId from body', () => {
    const user: TokenPayload = {
      userId: 'user-123',
      gymId: 'gym-123',
      role: UserRole.TRAINER,
      email: 'trainer@example.com',
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: {},
          query: {},
          body: { gymId: 'gym-456' },
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access to public routes', () => {
    const context = createMockExecutionContext(null);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
  });
});
