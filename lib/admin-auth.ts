import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET ?? 'fallback');

export interface AdminPayload {
  adminId: string;
  email: string;
  name: string;
  role: string;
}

/* ── Token operations ──────────────────────────────────────── */

export async function signAdminToken(
  payload: AdminPayload,
  expiry: string = '24h'
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(SECRET);
}

export async function signPreAuthToken(adminId: string): Promise<string> {
  return new SignJWT({ adminId, type: 'pre-auth' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminPayload> {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as unknown as AdminPayload;
}

export async function verifyPreAuthToken(token: string): Promise<{ adminId: string }> {
  const { payload } = await jwtVerify(token, SECRET);
  if ((payload as any).type !== 'pre-auth') throw new Error('Not a pre-auth token');
  return { adminId: (payload as any).adminId };
}

/* ── Session cookie helpers ────────────────────────────────── */

const COOKIE_NAME = 'admin_session';
const PREAUTH_COOKIE = 'admin_preauth';

export async function setAdminSession(
  res: NextResponse,
  payload: AdminPayload
): Promise<NextResponse> {
  const token = await signAdminToken(payload);
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
  return res;
}

export async function setPreAuthCookie(res: NextResponse, adminId: string): Promise<NextResponse> {
  const token = await signPreAuthToken(adminId);
  res.cookies.set(PREAUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 5, // 5 minutes
    path: '/',
  });
  return res;
}

export function clearAdminSession(res: NextResponse): NextResponse {
  res.cookies.delete(COOKIE_NAME);
  res.cookies.delete(PREAUTH_COOKIE);
  return res;
}

/* ── Request guards ────────────────────────────────────────── */

export async function getAdminFromRequest(req: NextRequest): Promise<AdminPayload | null> {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function getPreAuthFromRequest(req: NextRequest): Promise<{ adminId: string } | null> {
  try {
    const token = req.cookies.get(PREAUTH_COOKIE)?.value;
    if (!token) return null;
    return await verifyPreAuthToken(token);
  } catch {
    return null;
  }
}

/**
 * Call at the top of any admin API route handler.
 * Returns the admin payload or throws (which you should catch and return 401).
 */
export async function requireAdmin(req: NextRequest): Promise<AdminPayload> {
  const admin = await getAdminFromRequest(req);
  if (!admin) throw new Error('Unauthorized');
  return admin;
}

/* ── Server component helper (uses next/headers) ────────────── */

export async function getAdminSession(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

/* ── Standard JSON helpers ─────────────────────────────────── */

export function okJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
