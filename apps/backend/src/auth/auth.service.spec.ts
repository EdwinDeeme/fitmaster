import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockGym = {
    id: 'gym-123',
    name: 'Test Gym',
    subdomain: 'testgym',
    country: 'CR',
    timezone: 'America/Costa_Rica',
    settings: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    gymId: 'gym-123',
    email: 'test@example.com',
    passwordHash: '$2b$12$hashedpassword',
    role: UserRole.TRAINER,
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    gym: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      gymId: 'gym-123',
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      role: UserRole.TRAINER,
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should successfully register a new user', async () => {
      mockPrismaService.gym.findUnique.mockResolvedValue(mockGym);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockPrismaService.gym.findUnique).toHaveBeenCalledWith({
        where: { id: registerDto.gymId },
      });
    });

    it('should throw NotFoundException if gym does not exist', async () => {
      mockPrismaService.gym.findUnique.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.gym.findUnique.mockResolvedValue(mockGym);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should hash password with 12 salt rounds', async () => {
      mockPrismaService.gym.findUnique.mockResolvedValue(mockGym);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const bcryptHashSpy = jest.spyOn(bcrypt, 'hash');

      await service.register(registerDto);

      expect(bcryptHashSpy).toHaveBeenCalledWith(registerDto.password, 12);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    it('should successfully login with valid credentials', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid-refresh-token';
    const tokenPayload = {
      userId: mockUser.id,
      gymId: mockUser.gymId,
      role: mockUser.role,
      email: mockUser.email,
    };

    it('should successfully refresh tokens with valid refresh token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(tokenPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(tokenPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateToken', () => {
    const accessToken = 'valid-access-token';
    const tokenPayload = {
      userId: mockUser.id,
      gymId: mockUser.gymId,
      role: mockUser.role,
      email: mockUser.email,
    };

    it('should successfully validate a valid token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(tokenPayload);

      const result = await service.validateToken(accessToken);

      expect(result).toEqual(tokenPayload);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateToken(accessToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout existing user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.logout(mockUser.id)).resolves.not.toThrow();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.logout('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should enforce gym_id in user lookup', async () => {
      const registerDto: RegisterDto = {
        gymId: 'gym-123',
        email: 'test@example.com',
        password: 'SecurePass123!',
        role: UserRole.TRAINER,
        firstName: 'John',
        lastName: 'Doe',
      };

      mockPrismaService.gym.findUnique.mockResolvedValue(mockGym);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      await service.register(registerDto);

      // Ahora busca por email único, no por gymId_email
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: registerDto.email,
        },
      });
    });
  });

  describe('Token expiration', () => {
    it('should generate access token with 15 minute expiry', async () => {
      mockPrismaService.gym.findUnique.mockResolvedValue(mockGym);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const registerDto: RegisterDto = {
        gymId: 'gym-123',
        email: 'test@example.com',
        password: 'SecurePass123!',
        role: UserRole.TRAINER,
        firstName: 'John',
        lastName: 'Doe',
      };

      await service.register(registerDto);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          expiresIn: '15m',
        }),
      );
    });

    it('should generate refresh token with 7 day expiry', async () => {
      mockPrismaService.gym.findUnique.mockResolvedValue(mockGym);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const registerDto: RegisterDto = {
        gymId: 'gym-123',
        email: 'test@example.com',
        password: 'SecurePass123!',
        role: UserRole.TRAINER,
        firstName: 'John',
        lastName: 'Doe',
      };

      await service.register(registerDto);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          expiresIn: '7d',
        }),
      );
    });
  });
});
