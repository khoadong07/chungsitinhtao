import { createHmac } from 'crypto';

const SECRET = process.env['ADMIN_SECRET'] ?? 'dev-admin-secret-change-in-prod';

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function signAdminToken(): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  }));
  const sig = base64url(createHmac('sha256', SECRET).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

export function verifyAdminToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, sig] = parts as [string, string, string];
    const expected = base64url(createHmac('sha256', SECRET).update(`${header}.${payload}`).digest());
    if (sig !== expected) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64').toString()) as { exp?: number; role?: string };
    if (data.role !== 'admin') return false;
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}
