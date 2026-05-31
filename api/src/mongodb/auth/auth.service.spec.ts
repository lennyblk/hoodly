import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, UserRole } from '../../entities/mongodb/User';
import { RefreshToken } from '../../entities/mongodb/RefreshToken';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRefreshTokenRepo = {
    delete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('signed_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User, 'mongodb'), useValue: mockUserRepo },
        { provide: getRepositoryToken(RefreshToken, 'mongodb'), useValue: mockRefreshTokenRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockJwtService.signAsync.mockResolvedValue('signed_token');
  });

  describe('signup', () => {
    const dto = { email: 'test@test.com', password: 'Password1!', firstName: 'John', lastName: 'Doe' };

    it('throws ConflictException when email already taken', async () => {
      mockUserRepo.findOne.mockResolvedValue({ email: dto.email });

      await expect(service.signup(dto)).rejects.toThrow(ConflictException);
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('creates user with hashed password and returns tokens', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const fakeUser = {
        _id: { toString: () => 'uid1' },
        email: dto.email,
        role: UserRole.HABITANT,
        neighbourhoodId: null,
      };
      mockUserRepo.create.mockImplementation((data) => data);
      mockUserRepo.save.mockResolvedValue(fakeUser);
      mockRefreshTokenRepo.delete.mockResolvedValue(undefined);
      mockRefreshTokenRepo.create.mockReturnValue({});
      mockRefreshTokenRepo.save.mockResolvedValue(undefined);

      const tokens = await service.signup(dto);

      const createdArg = mockUserRepo.create.mock.calls[0][0];
      expect(createdArg.password).not.toBe(dto.password);
      expect(await bcrypt.compare(dto.password, createdArg.password)).toBe(true);
      expect(tokens).toEqual({ access_token: 'signed_token', refresh_token: 'signed_token' });
    });
  });

  describe('signin', () => {
    it('throws UnauthorizedException when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.signin({ email: 'no@one.com', password: 'pass' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException on wrong password', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        _id: { toString: () => 'uid1' },
        email: 'x@x.com',
        password: await bcrypt.hash('correct_password', 10),
        role: UserRole.HABITANT,
        neighbourhoodId: null,
      });

      await expect(service.signin({ email: 'x@x.com', password: 'wrong_password' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens on valid credentials', async () => {
      const plainPassword = 'Password1!';
      mockUserRepo.findOne.mockResolvedValue({
        _id: { toString: () => 'uid1' },
        email: 'x@x.com',
        password: await bcrypt.hash(plainPassword, 10),
        role: UserRole.HABITANT,
        neighbourhoodId: 'nid1',
      });
      mockRefreshTokenRepo.delete.mockResolvedValue(undefined);
      mockRefreshTokenRepo.create.mockReturnValue({});
      mockRefreshTokenRepo.save.mockResolvedValue(undefined);

      const tokens = await service.signin({ email: 'x@x.com', password: plainPassword });

      expect(tokens).toEqual({ access_token: 'signed_token', refresh_token: 'signed_token' });
    });
  });
});
