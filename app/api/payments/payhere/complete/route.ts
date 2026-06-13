import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { order_id, payment_reference } = await req.json();
    if (!order_id) return NextResponse.json({ error: 'order_id is required' }, { status: 400 });

    const userClient = await createServerSupabaseClient();
    const { data: { user } } = await userClient.auth.getUser();

    const supabase = createAdminSupabaseClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id')
      .eq('id', order_id)
      .single();

    if (orderError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.user_id && order.user_id !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'paid',
        payment_reference: payment_reference ?? order_id,
        paid_at: new Date().toISOString(),
      })
      .eq('id', order_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ order: data });
  } catch (err) {
    console.error('PayHere complete error:', err);
    return NextResponse.json({ error: 'Could not confirm PayHere payment' }, { status: 500 });
  }
}
