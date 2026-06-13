import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { requireAdmin, errJson, okJson } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try { await requireAdmin(req); } catch { return errJson('Unauthorized', 401); }
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.from('site_settings').select('*');
  const settings: Record<string, string> = {};
  (data ?? []).forEach((s: any) => { settings[s.key] = s.value; });
  return okJson(settings);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);
  const body = await req.json() as Record<string, string>;
  const supabase = createAdminSupabaseClient();

  const upserts = Object.entries(body).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' });
  if (error) return errJson(error.message, 500);

  await supabase.from('admin_activity_log').insert({
    admin_id: admin.adminId, action: 'update_settings', details: body,
  });

  return okJson({ success: true });
}
