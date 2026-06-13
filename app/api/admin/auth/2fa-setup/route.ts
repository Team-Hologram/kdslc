import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { requireAdmin, errJson, okJson } from '@/lib/admin-auth';

// GET — generate a new TOTP secret + QR code
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);

  const secret = authenticator.generateSecret();
  const uri = authenticator.keyuri(admin.email, 'KDSL Admin', secret);
  const qrDataUrl = await qrcode.toDataURL(uri);

  // Temporarily store the secret (not yet enabled until verified)
  const supabase = createAdminSupabaseClient();
  await supabase
    .from('admin_users')
    .update({ totp_secret: secret, totp_verified: false })
    .eq('id', admin.adminId);

  return okJson({ secret, qrDataUrl });
}

// POST — verify code and enable 2FA
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);

  const { code } = await req.json();
  if (!code) return errJson('Code required');

  const supabase = createAdminSupabaseClient();
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('totp_secret')
    .eq('id', admin.adminId)
    .single();

  if (!adminData?.totp_secret) return errJson('No pending 2FA setup found');

  const isValid = authenticator.verify({ token: code, secret: adminData.totp_secret });
  if (!isValid) return errJson('Invalid code');

  await supabase
    .from('admin_users')
    .update({ totp_enabled: true, totp_verified: true })
    .eq('id', admin.adminId);

  return okJson({ success: true, message: '2FA enabled successfully' });
}

// DELETE — disable 2FA
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);

  const supabase = createAdminSupabaseClient();
  await supabase
    .from('admin_users')
    .update({ totp_enabled: false, totp_verified: false, totp_secret: null })
    .eq('id', admin.adminId);

  return okJson({ success: true, message: '2FA disabled' });
}
