import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GymIsolationGuard } from './gym-isolation.guard';
import { UserRole } from '@prisma/client';
import { TokenPayload } from '../interfaces';

describe('GymIsolationGuard', () => {
  let guard: GymIsolationGuard;

  beforeEach(() => {
    guard = new GymIsolationGuard();
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
    } as any;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw ForbiddenException if user is not authenticated', () => {
    const context = createMockExecutionContext(null);

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
    } as any;

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
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
