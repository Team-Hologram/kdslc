import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { requireAdmin, errJson, okJson } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try { await requireAdmin(req); } catch { return errJson('Unauthorized', 401); }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = 20;

  const supabase = createAdminSupabaseClient();

  // List Supabase auth users via admin API
  const { data: { users }, error } = await supabase.auth.admin.listUsers({
    page,
    perPage: limit,
  });

  if (error) return errJson(error.message, 500);

  // Get order stats per user
  const { data: orders } = await supabase
    .from('orders')
    .select('user_id, total, status');

  const orderMap: Record<string, { count: number; total: number }> = {};
  (orders ?? []).forEach((o: any) => {
    if (!o.user_id) return;
    if (!orderMap[o.user_id]) orderMap[o.user_id] = { count: 0, total: 0 };
    orderMap[o.user_id].count++;
    orderMap[o.user_id].total += o.total ?? 0;
  });

  let result = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? '—',
    created_at: u.created_at,
    last_sign_in: u.last_sign_in_at,
    confirmed: !!u.email_confirmed_at,
    orders: orderMap[u.id]?.count ?? 0,
    total_spent: orderMap[u.id]?.total ?? 0,
  }));

  if (search) {
    result = result.filter(
      (u) => u.email?.includes(search) || u.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  return okJson({ users: result, total: result.length });
}
