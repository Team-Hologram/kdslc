import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { requireAdmin, errJson, okJson } from '@/lib/admin-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(req); } catch { return errJson('Unauthorized', 401); }
  const { id } = await params;
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error) return errJson('Order not found', 404);
  return okJson(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);
  const { id } = await params;
  const body = await req.json();

  const supabase = createAdminSupabaseClient();

  // Get current order to update status history
  const { data: order } = await supabase.from('orders').select('status, status_history').eq('id', id).single();
  if (!order) return errJson('Order not found', 404);

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  if (body.status && body.status !== order.status) {
    const history = Array.isArray(order.status_history) ? order.status_history : [];
    history.push({
      from: order.status,
      to: body.status,
      timestamp: new Date().toISOString(),
      by: admin.name,
    });
    updates.status = body.status;
    updates.status_history = history;
  }

  if (body.tracking_number !== undefined) updates.tracking_number = body.tracking_number;
  if (body.notes !== undefined) updates.notes = body.notes;

  const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
  if (error) return errJson(error.message, 500);

  // Log activity
  await supabase.from('admin_activity_log').insert({
    admin_id: admin.adminId,
    action: 'update_order',
    entity: 'order',
    entity_id: id,
    details: updates,
  });

  return okJson(data);
}
