import { BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;
  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('otp_token'),
  };

  beforeEach(() => {
    service = new (OtpService as any)(mockJwtService);
    jest.clearAllMocks();
  });

  describe('verify', () => {
    it('throws BadRequestException when no code stored', async () => {
      await expect(service.verify('test@test.com', '123456'))
        .rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException on wrong code', async () => {
      // Manually insert into the store
      (service as any).store.set('test@test.com', {
        code: '111111',
        expiresAt: new Date(Date.now() + 60000),
      });

      await expect(service.verify('test@test.com', '999999'))
        .rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException on expired code', async () => {
      (service as any).store.set('test@test.com', {
        code: '123456',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.verify('test@test.com', '123456'))
        .rejects.toThrow(BadRequestException);
    });

    it('returns JWT token on valid code', async () => {
      (service as any).store.set('test@test.com', {
        code: '123456',
        expiresAt: new Date(Date.now() + 60000),
      });

      const token = await service.verify('test@test.com', '123456');
      expect(token).toBe('otp_token');
      expect(mockJwtService.signAsync).toHaveBeenCalled();
      // Store should be cleared
      expect((service as any).store.has('test@test.com')).toBe(false);
    });
  });
});
