# Authentication Module - Usage Examples

## Basic Controller with Authentication

```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '@prisma/client';
import { TokenPayload } from '../auth/interfaces';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  
  // Only GYM_ADMIN and TRAINER can create clients
  @Roles(UserRole.GYM_ADMIN, UserRole.TRAINER)
  @Post()
  async createClient(
    @Body() createClientDto: CreateClientDto,
    @CurrentUser() user: TokenPayload,
  ) {
    // user.gymId is automatically available
    return this.clientsService.create(user.gymId, createClientDto);
  }

  // Any authenticated user can view clients (filtered by their gym)
  @Get()
  async getClients(@CurrentUser('gymId') gymId: string) {
    return this.clientsService.findAll(gymId);
  }

  // Get current user's profile
  @Get('me')
  async getMyProfile(@CurrentUser() user: TokenPayload) {
    return {
      userId: user.userId,
      gymId: user.gymId,
      role: user.role,
      email: user.email,
    };
  }
}
```

## Public Routes

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators';

@Controller('public')
export class PublicController {
  
  // This route doesn't require authentication
  @Public()
  @Get('info')
  getPublicInfo() {
    return {
      appName: 'FitMaster',
      version: '1.0.0',
    };
  }
}
```

## Service with Gym Isolation

```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(gymId: string) {
    // Always filter by gymId
    return this.prisma.client.findMany({
      where: { gymId },
    });
  }

  async findOne(gymId: string, clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    // Verify client belongs to the gym
    if (client && client.gymId !== gymId) {
      throw new ForbiddenException('Access denied to this client');
    }

    return client;
  }

  async create(gymId: string, data: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        ...data,
        gymId, // Always set gymId from authenticated user
      },
    });
  }
}
```

## Frontend Integration (React/Next.js)

### Login Component

```typescript
import { useState } from 'react';
import axios from 'axios';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('/api/v1/auth/login', {
        email,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
      alert('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Axios Interceptor with Token Refresh

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request interceptor - add access token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Update tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

## Mobile Integration (React Native)

### Secure Token Storage

```typescript
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export const authService = {
  async login(email: string, password: string) {
    const response = await axios.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;

    // Store tokens securely
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));

    return user;
  },

  async logout() {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    
    try {
      await axios.post('/auth/logout', null, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } finally {
      // Clear tokens even if logout fails
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
    }
  },

  async getAccessToken() {
    return await SecureStore.getItemAsync('accessToken');
  },

  async refreshToken() {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    
    const response = await axios.post('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', newRefreshToken);

    return accessToken;
  },
};
```

## Testing Examples

### Integration Test

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        gymId: 'test-gym-id',
        email: 'test@example.com',
        password: 'SecurePass123!',
        role: 'TRAINER',
        firstName: 'John',
        lastName: 'Doe',
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.user.email).toBe('test@example.com');
  });

  it('should login with valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
      })
      .expect(200);

    accessToken = response.body.accessToken;
    expect(accessToken).toBeDefined();
  });

  it('should access protected route with valid token', async () => {
    await request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('should reject access without token', async () => {
    await request(app.getHttpServer())
      .get('/clients')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## Common Patterns

### Checking User Permissions in Service

```typescript
@Injectable()
export class ClientsService {
  canUserAccessClient(user: TokenPayload, client: Client): boolean {
    // SUPER_ADMIN can access everything
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // User must be from same gym
    if (user.gymId !== client.gymId) {
      return false;
    }

    // CLIENT role can only access their own data
    if (user.role === UserRole.CLIENT) {
      return user.userId === client.id;
    }

    // GYM_ADMIN, TRAINER, RECEPTIONIST can access all clients in their gym
    return true;
  }
}
```

### Custom Guard for Resource Ownership

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class ClientOwnershipGuard implements CanActivate {
  constructor(private clientsService: ClientsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const clientId = request.params.clientId;

    const client = await this.clientsService.findOne(user.gymId, clientId);
    
    return this.clientsService.canUserAccessClient(user, client);
  }
}
```
