import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@prisma/client';
import { TokenPayload } from '../interfaces';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (
    user: TokenPayload | null,
    requiredRoles: UserRole[] | null,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no roles are required', () => {
    const context = createMockExecutionContext(null, null);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce(null); // roles

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    const user: TokenPayload = {
      userId: 'user-123',
      gymId: 'gym-123',
      role: UserRole.GYM_ADMIN,
      email: 'admin@example.com',
    };

    const context = createMockExecutionContext(user, [UserRole.GYM_ADMIN]);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce([UserRole.GYM_ADMIN]); // roles

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user does not have required role', () => {
    const user: TokenPayload = {
      userId: 'user-123',
      gymId: 'gym-123',
      role: UserRole.TRAINER,
      email: 'trainer@example.com',
    };

    const context = createMockExecutionContext(user, [UserRole.GYM_ADMIN]);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce([UserRole.GYM_ADMIN]); // roles

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user is not authenticated', () => {
    const context = createMockExecutionContext(null, [UserRole.GYM_ADMIN]);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce([UserRole.GYM_ADMIN]); // roles

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if user has one of multiple required roles', () => {
    const user: TokenPayload = {
      userId: 'user-123',
      gymId: 'gym-123',
      role: UserRole.TRAINER,
      email: 'trainer@example.com',
    };

    const context = createMockExecutionContext(user, [
      UserRole.GYM_ADMIN,
      UserRole.TRAINER,
    ]);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce([UserRole.GYM_ADMIN, UserRole.TRAINER]); // roles

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access to public routes', () => {
    const context = createMockExecutionContext(null, [UserRole.GYM_ADMIN]);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
  });
});
