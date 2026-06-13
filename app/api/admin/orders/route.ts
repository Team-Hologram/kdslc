import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { requireAdmin, errJson, okJson } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try { await requireAdmin(req); } catch { return errJson('Unauthorized', 401); }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== 'all') query = query.eq('status', status);
  if (search) query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,id.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) return errJson(error.message, 500);

  return okJson({ orders: data, total: count, page, pages: Math.ceil((count ?? 0) / limit) });
}
