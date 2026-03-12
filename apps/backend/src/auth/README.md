# Authentication Module

## Overview

This module implements a complete multi-tenant authentication system with JWT tokens, role-based access control (RBAC), and gym isolation for the FitMaster application.

## Features

- **JWT Authentication**: Access tokens (15 min) and refresh tokens (7 days)
- **Token Rotation**: Refresh tokens are rotated on each use for enhanced security
- **Password Hashing**: bcrypt with 12 salt rounds
- **Multi-tenant Isolation**: Automatic gym_id validation
- **Role-Based Access Control**: Support for 5 user roles
- **Guards**: JwtAuthGuard, RolesGuard, GymIsolationGuard

## User Roles

- `SUPER_ADMIN`: Full system access across all gyms
- `GYM_ADMIN`: Full access to their gym
- `TRAINER`: Manage clients and routines
- `RECEPTIONIST`: Manage clients, memberships, and payments
- `CLIENT`: Access to personal data only

## API Endpoints

### POST /auth/register
Register a new user in a gym.

**Request Body:**
```json
{
  "gymId": "uuid",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "TRAINER",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "gymId": "uuid",
    "email": "user@example.com",
    "role": "TRAINER",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Same as register

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** Same as register (with new tokens)

### POST /auth/logout
Logout current user (requires authentication).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:** 204 No Content

## Guards

### JwtAuthGuard
Validates JWT access tokens on protected routes. Applied globally to all routes except those marked with `@Public()`.

### RolesGuard
Enforces role-based access control. Use with `@Roles()` decorator.

**Example:**
```typescript
@Roles(UserRole.GYM_ADMIN, UserRole.TRAINER)
@Get('clients')
async getClients() {
  // Only GYM_ADMIN and TRAINER can access
}
```

### GymIsolationGuard
Ensures users can only access resources from their own gym. SUPER_ADMIN can access all gyms.

Validates `gymId` from:
- Request params: `/gyms/:gymId/clients`
- Query params: `/clients?gymId=uuid`
- Request body: `{ gymId: "uuid", ... }`

## Decorators

### @Public()
Mark routes as public (skip JWT authentication).

```typescript
@Public()
@Get('health')
getHealth() {
  return { status: 'ok' };
}
```

### @Roles(...roles)
Require specific roles to access a route.

```typescript
@Roles(UserRole.GYM_ADMIN)
@Delete('clients/:id')
deleteClient() {
  // Only GYM_ADMIN can delete
}
```

### @CurrentUser()
Get current user from request.

```typescript
@Get('profile')
getProfile(@CurrentUser() user: TokenPayload) {
  return user;
}

// Or get specific field
@Get('profile')
getProfile(@CurrentUser('userId') userId: string) {
  return { userId };
}
```

## Security Features

1. **Password Hashing**: bcrypt with 12 salt rounds (as per OWASP recommendations)
2. **Token Expiration**: Short-lived access tokens (15 min) for security
3. **Token Rotation**: Refresh tokens are rotated on each use
4. **Multi-tenant Isolation**: Automatic validation of gym_id
5. **Role-Based Access**: Fine-grained permission control

## Environment Variables

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
```

## Testing

Run authentication tests:
```bash
npm test -- --testPathPattern=auth
```

Test coverage includes:
- ✅ Successful registration and login
- ✅ Invalid credentials handling
- ✅ Token expiration validation
- ✅ Multi-tenant isolation
- ✅ Role-based access control
- ✅ Token rotation
- ✅ Password hashing with 12 salt rounds

## Requirements Covered

This module implements the following requirements:

- **Req 1.1-1.7**: JWT authentication with access and refresh tokens
- **Req 2.1-2.2**: Multi-tenant data isolation
- **Req 15.1-15.4**: Role-based access control
- **Req 27.1-27.6**: Session management and token rotation

## Future Enhancements

- [ ] Redis-based token blacklist for logout
- [ ] Rate limiting per user
- [ ] Two-factor authentication (2FA)
- [ ] OAuth2 integration (Google, Facebook)
- [ ] Password reset functionality
- [ ] Email verification
