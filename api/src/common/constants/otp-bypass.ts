export const OTP_BYPASS_EMAILS = [
  'admin@hoodly.com',
  'modo.montmartre@hoodly.com',
  'modo.belleville@hoodly.com',
  'modo.marais@hoodly.com',
  'modo.bastille@hoodly.com',
  'modo.republique@hoodly.com',
  'modo.bonmarche@hoodly.com',
  'alice@hoodly.com',
  'bob@hoodly.com',
  'julien@hoodly.com',
  'camille@hoodly.com',
  'charlie@hoodly.com',
  'diana@hoodly.com',
  'karim@hoodly.com',
  'lea@hoodly.com',
  'eve@hoodly.com',
  'frank@hoodly.com',
  'nadia@hoodly.com',
  'grace@hoodly.com',
  'hugo@hoodly.com',
  'omar@hoodly.com',
  'iris@hoodly.com',
  'thomas@hoodly.com',
  'sophie@hoodly.com',
  'remi@hoodly.com',
  'clara@hoodly.com',
];

export function isOtpBypassed(email: string): boolean {
  return OTP_BYPASS_EMAILS.includes(email.toLowerCase());
}
