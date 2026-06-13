import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { requireAdmin, errJson, okJson } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try { await requireAdmin(req); } catch { return errJson('Unauthorized', 401); }
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from('bundle_deals').select('*').order('created_at', { ascending: false });
  if (error) return errJson(error.message, 500);
  return okJson(data ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);
  const body = await req.json();
  if (!body.title || !body.product_ids?.length) return errJson('title and product_ids required');
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from('bundle_deals').insert(body).select().single();
  if (error) return errJson(error.message, 500);
  return okJson(data, 201);
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return errJson('id required');
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from('bundle_deals').update(updates).eq('id', id).select().single();
  if (error) return errJson(error.message, 500);
  return okJson(data);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);
  const { id } = await req.json();
  if (!id) return errJson('id required');
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from('bundle_deals').delete().eq('id', id);
  if (error) return errJson(error.message, 500);
  return okJson({ success: true });
}
