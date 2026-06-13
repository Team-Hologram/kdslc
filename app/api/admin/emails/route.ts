import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { requireAdmin, errJson, okJson } from '@/lib/admin-auth';

// GET campaigns + subscriber count
export async function GET(req: NextRequest) {
  try { await requireAdmin(req); } catch { return errJson('Unauthorized', 401); }
  const supabase = createAdminSupabaseClient();
  const [{ data: campaigns }, { count: subscriberCount }] = await Promise.all([
    supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }),
    supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ]);
  return okJson({ campaigns: campaigns ?? [], subscriberCount: subscriberCount ?? 0 });
}

// POST — create campaign draft
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);
  const { subject, body } = await req.json();
  if (!subject || !body) return errJson('subject and body required');
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('email_campaigns')
    .insert({ subject, body, status: 'draft', created_by: admin.adminId })
    .select().single();
  if (error) return errJson(error.message, 500);
  return okJson(data, 201);
}
