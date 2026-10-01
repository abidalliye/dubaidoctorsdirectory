import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

export const hashToken = (value: string) => createHash('sha256').update(value).digest('hex');
export const newToken = () => randomBytes(32).toString('hex');
async function derive(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => error ? reject(error) : resolve(key));
  });
}
export function validatePassword(value: unknown): string {
  if (typeof value !== 'string' || value.length < 12 || value.length > 128)
    throw new BadRequestException('Use a password between 12 and 128 characters');
  return value;
}
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${(await derive(password, salt)).toString('hex')}`;
}
export async function checkPassword(password: string, stored?: string) {
  const [, salt, encoded] = (stored || `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
  const key = await derive(password, salt);
  const expected = Buffer.from(encoded, 'hex');
  return expected.length === key.length && timingSafeEqual(expected, key) && Boolean(stored);
}
export function emailAddress(value: unknown) {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    throw new BadRequestException('Enter a valid email address');
  return value.trim().toLowerCase();
}
export function field(value: unknown, max = 200, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()))
    throw new BadRequestException('Invalid profile field');
  return value.trim();
}
export function bodyObject(value: unknown): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Invalid request');
  return value as Record<string, any>;
}
export function sameOrigin(request: any) {
  const allowed = [process.env.WEB_ORIGIN, process.env.URL, process.env.DEPLOY_URL,
    ...(process.env.NETLIFY ? [] : ['http://localhost:3000', 'http://127.0.0.1:4000'])].filter(Boolean);
  if (!allowed.includes(request.headers.origin) || request.headers['x-requested-with'] !== 'FertiFind')
    throw new ForbiddenException('Invalid request origin');
}
export function cookie(request: any, name: string): string {
  const match = String(request.headers.cookie || '').split(';').map((x: string) => x.trim())
    .find((x: string) => x.startsWith(name + '='));
  return match ? match.slice(name.length + 1) : '';
}
export function setSessionCookies(response: any, token: string, csrf: string, clear = false) {
  // Netlify's NETLIFY/NODE_ENV build flags are not necessarily function runtime
  // variables. Default to Secure; only explicitly local development may omit it.
  const localOrigin = process.env.WEB_ORIGIN || process.env.URL || '';
  const secure = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(localOrigin) && process.env.NODE_ENV !== 'production' ? '' : '; Secure';
  const common = `; Path=/; SameSite=Lax; Max-Age=${clear ? 0 : 604800}${secure}`;
  response.setHeader('Set-Cookie', [`ff_session=${token}${common}; HttpOnly`, `ff_csrf=${csrf}${common}`]);
}
export const publicUser = (user: any) => ({
  id: user.id, email: user.email, name: user.name, phone: user.phone,
  role: user.role, status: user.status, emailVerified: user.email_verified,
  profile: user.profile, registeredAt: user.created_at,
  permissions: user.role === 'admin' ? ['account:own','users:manage','providers:manage']
    : user.role === 'patient' ? ['account:own']
    : ['account:own','providers:own', ...(user.status === 'active' ? ['provider:approved'] : [])]
});
