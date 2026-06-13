import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { createPayHereNotifyHash } from '@/lib/payment-providers';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const merchantId = String(formData.get('merchant_id') ?? '');
    const orderId = String(formData.get('order_id') ?? '');
    const amount = String(formData.get('payhere_amount') ?? '');
    const currency = String(formData.get('payhere_currency') ?? '');
    const statusCode = String(formData.get('status_code') ?? '');
    const md5sig = String(formData.get('md5sig') ?? '').toUpperCase();
    const paymentId = String(formData.get('payment_id') ?? '');
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantSecret || !orderId) {
      return NextResponse.json({ error: 'Invalid notification' }, { status: 400 });
    }

    const expected = createPayHereNotifyHash({
      merchantId,
      orderId,
      amount,
      currency,
      statusCode,
      merchantSecret,
    });

    if (expected !== md5sig) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (statusCode === '2') {
      const supabase = createAdminSupabaseClient();
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid',
          payment_reference: paymentId || orderId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('PayHere notify error:', err);
    return NextResponse.json({ error: 'Could not process notification' }, { status: 500 });
  }
}
