import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { OtpEmail } from '../../emails/OtpEmail';

interface OtpEntry {
  code: string;
  expiresAt: Date;
}

@Injectable()
export class OtpService {
  private readonly store = new Map<string, OtpEntry>();
  private readonly transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  constructor(private jwtService: JwtService) {}

  async send(email: string, firstName: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const entry: OtpEntry = { code, expiresAt };

    this.store.set(email, entry);
    setTimeout(() => {
      if (this.store.get(email) === entry) this.store.delete(email);
    }, 5 * 60 * 1000);

    const html = await render(OtpEmail({ code, firstName }));

    try {
      await this.transporter.sendMail({
        from: `Hoodly <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Votre code de vérification',
        html,
      });
    } catch (error) {
      console.error('[OTP] Nodemailer error:', error);
      throw new InternalServerErrorException('Échec de l\'envoi du code par email');
    }
  }

  async verify(email: string, code: string): Promise<string> {
    const entry = this.store.get(email);

    if (!entry || entry.expiresAt < new Date()) {
      this.store.delete(email);
      throw new BadRequestException('Code expiré ou invalide');
    }

    if (entry.code !== code) {
      throw new BadRequestException('Code incorrect');
    }

    this.store.delete(email);

    return this.jwtService.signAsync(
      { email, type: 'otp' },
      { secret: process.env.OTP_SECRET!, expiresIn: '2m' },
    );
  }
}
