import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getPayPalAccessToken, paypalBaseUrl } from '@/lib/payment-providers';

export async function POST(req: NextRequest) {
  try {
    const { order_id, paypal_order_id } = await req.json();
    if (!order_id || !paypal_order_id) {
      return NextResponse.json({ error: 'order_id and paypal_order_id are required' }, { status: 400 });
    }

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

    const accessToken = await getPayPalAccessToken();
    const captureRes = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${paypal_order_id}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    const capture = await captureRes.json();
    if (!captureRes.ok) {
      return NextResponse.json({ error: capture.message ?? 'Could not capture PayPal payment' }, { status: 502 });
    }

    const captureId = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? paypal_order_id;
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: capture.status === 'COMPLETED' ? 'paid' : String(capture.status ?? 'pending').toLowerCase(),
        status: capture.status === 'COMPLETED' ? 'paid' : 'payment_pending',
        payment_reference: captureId,
        paid_at: capture.status === 'COMPLETED' ? new Date().toISOString() : null,
      })
      .eq('id', order.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ order: data, capture });
  } catch (err) {
    console.error('PayPal capture error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not capture PayPal payment' }, { status: 500 });
  }
}
