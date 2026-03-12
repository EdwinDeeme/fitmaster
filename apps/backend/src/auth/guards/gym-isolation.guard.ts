import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TokenPayload } from '../interfaces';
import { UserRole } from '@prisma/client';

@Injectable()
export class GymIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: TokenPayload = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SUPER_ADMIN can access any gym
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Extract gymId from request (params, query, or body)
    const gymIdFromRequest =
      request.params?.gymId ||
      request.query?.gymId ||
      request.body?.gymId;

    if (!gymIdFromRequest) {
      // If no gymId in request, allow (will be filtered by service layer)
      return true;
    }

    // Validate user belongs to the requested gym
    if (user.gymId !== gymIdFromRequest) {
      throw new ForbiddenException(
        'Access denied: You do not have permission to access resources from this gym',
      );
    }

    return true;
  }
}
