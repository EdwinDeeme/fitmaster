import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { UserRole } from '@prisma/client';
import { AuthResult } from './interfaces';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthResult: AuthResult = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 'user-123',
      gymId: 'gym-123',
      email: 'test@example.com',
      role: UserRole.TRAINER,
      firstName: 'John',
      lastName: 'Doe',
      mustChangePassword: false,
    },
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        gymId: 'gym-123',
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        role: UserRole.TRAINER,
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockAuthService.register.mockResolvedValue(mockAuthResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'valid-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(mockAuthResult);

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual(mockAuthResult);
      expect(authService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      );
    });
  });

  describe('logout', () => {
    it('should logout a user', async () => {
      const userId = 'user-123';

      mockAuthService.logout.mockResolvedValue(undefined);

      await controller.logout(userId);

      expect(authService.logout).toHaveBeenCalledWith(userId);
    });
  });
});
