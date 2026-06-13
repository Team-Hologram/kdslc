import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { normalizePaymentMethod } from '@/lib/payment-providers';
import { priceCheckoutOrder } from '@/lib/checkout-pricing';

// GET — fetch logged-in user's orders (newest first)
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ orders: [] });

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ orders: data ?? [] });
  } catch (err) {
    console.error('Orders GET error:', err);
    return NextResponse.json({ orders: [] });
  }
}

// POST — create a new order + send admin notification
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      customer_name, customer_email, shipping_address, items,
      promo_code = null,
      payment_method,
      payment_status,
      payment_reference = null,
    } = body;
    const finalPaymentMethod = normalizePaymentMethod(payment_method);
    const priced = await priceCheckoutOrder(supabase, { items, promo_code });
    if ('error' in priced) return NextResponse.json({ error: priced.error }, { status: priced.status });
    const initialPaymentStatus = payment_status === 'paid' ? 'paid' : 'payment_pending';
    const initialOrderStatus = initialPaymentStatus === 'paid' ? 'paid' : 'payment_pending';

    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id ?? null,
        customer_name,
        customer_email,
        shipping_address,
        items: priced.pricedItems,
        subtotal: priced.subtotal,
        shipping_fee: priced.shipping_fee,
        promo_code: priced.promo_code,
        discount_amount: priced.discount_amount,
        total: priced.total,
        payment_method: finalPaymentMethod,
        payment_status: initialPaymentStatus,
        payment_reference,
        paid_at: initialPaymentStatus === 'paid' ? new Date().toISOString() : null,
        status: initialOrderStatus,
      })
      .select()
      .single();

    if (error) throw error;

    // ── Admin notification email ─────────────────────────────
    try {
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
      const resendKey = process.env.RESEND_API_KEY;
      if (adminEmail && resendKey && data) {
        const itemsHtml = priced.pricedItems
          .map((item) => `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${item.size ?? '—'} / ${item.color ?? '—'}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">×${item.quantity ?? 1}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">LKR ${((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString('en-LK')}</td>
          </tr>`).join('');

        const addr = shipping_address ?? {};
        const addrText = [addr.fullName, addr.addressLine1, addr.city, addr.province]
          .filter(Boolean).join(', ');

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: 'KDSL Orders <noreply@kdslclothing.com>',
            to: adminEmail,
            subject: `🛍️ New Order — LKR ${priced.total.toLocaleString('en-LK')} from ${customer_name}`,
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:#0f172a;padding:28px;border-radius:12px 12px 0 0;text-align:center;">
                  <h1 style="color:#1ECFC8;margin:0;font-size:22px;">🛍️ New Order Received!</h1>
                  <p style="color:rgba(255,255,255,0.5);margin:6px 0 0;font-size:13px;">Order #${data.id.slice(0, 8)}</p>
                </div>
                <div style="background:#f8fafc;padding:28px;">
                  <table style="width:100%;margin-bottom:20px;font-size:14px;border-collapse:collapse;">
                    <tr><td style="padding:6px 0;color:#64748b;width:120px;">Customer</td><td style="font-weight:700;">${customer_name}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;">Email</td><td>${customer_email}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;">Payment</td><td>${finalPaymentMethod.replace('_', ' ')}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;">Ship To</td><td>${addrText || '—'}</td></tr>
                    ${priced.promo_code ? `<tr><td style="padding:6px 0;color:#64748b;">Promo</td><td>${priced.promo_code} (−LKR ${priced.discount_amount.toLocaleString('en-LK')})</td></tr>` : ''}
                  </table>
                  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
                    <thead><tr style="background:#e2e8f0;">
                      <th style="padding:10px;text-align:left;">Item</th>
                      <th style="padding:10px;">Size/Color</th>
                      <th style="padding:10px;">Qty</th>
                      <th style="padding:10px;text-align:right;">Price</th>
                    </tr></thead>
                    <tbody>${itemsHtml}</tbody>
                  </table>
                  <table style="width:100%;font-size:14px;border-collapse:collapse;">
                    <tr><td style="padding:4px 0;color:#64748b;">Subtotal</td><td style="text-align:right;">LKR ${priced.subtotal.toLocaleString('en-LK')}</td></tr>
                    ${priced.discount_amount > 0 ? `<tr><td style="padding:4px 0;color:#22c55e;">Discount</td><td style="text-align:right;color:#22c55e;">−LKR ${priced.discount_amount.toLocaleString('en-LK')}</td></tr>` : ''}
                    <tr><td style="padding:4px 0;color:#64748b;">Shipping</td><td style="text-align:right;">${priced.shipping_fee === 0 ? 'FREE' : `LKR ${priced.shipping_fee.toLocaleString('en-LK')}`}</td></tr>
                    <tr><td colspan="2" style="padding:0;height:1px;background:#e2e8f0;"></td></tr>
                    <tr style="font-size:18px;font-weight:800;">
                      <td style="padding:12px 0 4px;">TOTAL</td>
                      <td style="text-align:right;padding:12px 0 4px;color:#1ECFC8;">LKR ${priced.total.toLocaleString('en-LK')}</td>
                    </tr>
                  </table>
                  <div style="text-align:center;margin-top:28px;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${data.id}"
                       style="background:#1ECFC8;color:#0f172a;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;font-size:14px;">
                      View Order in Admin Panel →
                    </a>
                  </div>
                </div>
                <div style="background:#f1f5f9;padding:16px;text-align:center;font-size:11px;color:#94a3b8;border-radius:0 0 12px 12px;">
                  KDSL Clothing Admin Notification
                </div>
              </div>
            `,
          }),
        });
      }
    } catch (emailErr) {
      console.error('Admin notification email failed:', emailErr);
      // Don't fail the order if email fails
    }

    return NextResponse.json({ order: data });
  } catch (err) {
    console.error('Orders POST error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
