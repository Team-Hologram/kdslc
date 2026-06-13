import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import {
  setAdminSession,
  setPreAuthCookie,
  errJson,
  okJson,
} from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) return errJson('Email and password are required');

  const supabase = createAdminSupabaseClient();

  // Fetch admin user
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('is_active', true)
    .single();

  if (error || !admin) return errJson('Invalid credentials', 401);

  // Verify password
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return errJson('Invalid credentials', 401);

  // Update last_login
  await supabase
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', admin.id);

  // Log activity
  await supabase.from('admin_activity_log').insert({
    admin_id: admin.id,
    action: 'login',
    details: { email: admin.email },
    ip_address: req.headers.get('x-forwarded-for') ?? 'unknown',
  });

  // Check if 2FA is enabled
  if (admin.totp_enabled && admin.totp_verified) {
    // Issue pre-auth token, require TOTP verification
    const res = NextResponse.json({ success: true, requires2fa: true });
    return setPreAuthCookie(res, admin.id);
  }

  // No 2FA — issue full session
  const payload = { adminId: admin.id, email: admin.email, name: admin.name, role: admin.role };
  const res = NextResponse.json({
    success: true,
    requires2fa: false,
    admin: { name: admin.name, role: admin.role },
  });
  return setAdminSession(res, payload);
}
