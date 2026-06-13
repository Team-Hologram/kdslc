import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getPayPalAccessToken, lkrToPaypalAmount, paypalBaseUrl, paypalCurrency } from '@/lib/payment-providers';

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json();
    if (!order_id) return NextResponse.json({ error: 'order_id is required' }, { status: 400 });

    const userClient = await createServerSupabaseClient();
    const { data: { user } } = await userClient.auth.getUser();

    const supabase = createAdminSupabaseClient();
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, user_id, total')
      .eq('id', order_id)
      .single();

    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.user_id && order.user_id !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await getPayPalAccessToken();
    const currency = paypalCurrency();
    const value = lkrToPaypalAmount(order.total);

    const paypalRes = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: order.id,
          custom_id: order.id,
          description: `KDSL Clothing Order #${order.id.slice(0, 8)}`,
          amount: { currency_code: currency, value },
        }],
      }),
    });

    const paypalOrder = await paypalRes.json();
    if (!paypalRes.ok) {
      return NextResponse.json({ error: paypalOrder.message ?? 'Could not create PayPal order' }, { status: 502 });
    }

    await supabase
      .from('orders')
      .update({ payment_reference: paypalOrder.id })
      .eq('id', order.id);

    return NextResponse.json({ id: paypalOrder.id });
  } catch (err) {
    console.error('PayPal create order error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not create PayPal order' }, { status: 500 });
  }
}
