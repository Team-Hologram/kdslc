import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createPayHereHash } from '@/lib/payment-providers';

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json();
    if (!order_id) return NextResponse.json({ error: 'order_id is required' }, { status: 400 });

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantId || !merchantSecret) {
      return NextResponse.json({ error: 'PayHere credentials are not configured' }, { status: 500 });
    }

    const userClient = await createServerSupabaseClient();
    const { data: { user } } = await userClient.auth.getUser();

    const supabase = createAdminSupabaseClient();
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.user_id && order.user_id !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const amount = Number(order.total ?? 0).toFixed(2);
    const currency = 'LKR';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
    const address = order.shipping_address as Record<string, string> | null;
    const [firstName = '', ...lastNameParts] = String(order.customer_name ?? '').split(' ');

    return NextResponse.json({
      sandbox: process.env.NEXT_PUBLIC_PAYHERE_SANDBOX !== 'false',
      merchant_id: merchantId,
      return_url: `${siteUrl}/checkout`,
      cancel_url: `${siteUrl}/checkout`,
      notify_url: `${siteUrl}/api/payments/payhere/notify`,
      order_id: order.id,
      items: `KDSL Clothing Order #${order.id.slice(0, 8)}`,
      amount,
      currency,
      hash: createPayHereHash({ merchantId, orderId: order.id, amount, currency, merchantSecret }),
      first_name: firstName,
      last_name: lastNameParts.join(' '),
      email: order.customer_email ?? '',
      phone: address?.phone ?? '',
      address: address?.address ?? '',
      city: address?.city ?? '',
      country: 'Sri Lanka',
    });
  } catch (err) {
    console.error('PayHere session error:', err);
    return NextResponse.json({ error: 'Could not start PayHere payment' }, { status: 500 });
  }
}
