import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import {
  getPreAuthFromRequest,
  setAdminSession,
  clearAdminSession,
  errJson,
} from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return errJson('OTP code required');

  const preAuth = await getPreAuthFromRequest(req);
  if (!preAuth) return errJson('Session expired. Please log in again.', 401);

  const supabase = createAdminSupabaseClient();

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, email, name, role, totp_secret')
    .eq('id', preAuth.adminId)
    .single();

  if (!admin?.totp_secret) return errJson('2FA not configured', 401);

  const isValid = authenticator.verify({ token: code, secret: admin.totp_secret });
  if (!isValid) return errJson('Invalid or expired code', 401);

  const payload = { adminId: admin.id, email: admin.email, name: admin.name, role: admin.role };
  let res: any = NextResponse.json({ success: true });
  res = clearAdminSession(res); // clear pre-auth cookie
  return setAdminSession(res, payload) as unknown as NextResponse;
}
