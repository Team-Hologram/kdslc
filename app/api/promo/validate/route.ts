import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();

    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json({ valid: false, message: 'Invalid request.' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();

    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle();

    if (error || !promo) {
      return NextResponse.json({ valid: false, message: 'Invalid or expired promo code.' });
    }

    // Check minimum order requirement
    if (promo.min_order > 0 && subtotal < promo.min_order) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order of LKR ${promo.min_order.toLocaleString()} required for this code.`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    let discountLabel = '';

    if (promo.discount_type === 'percentage') {
      discountAmount = Math.round(subtotal * promo.discount_value / 100);
      discountLabel = `${promo.discount_value}% off`;
    } else if (promo.discount_type === 'fixed') {
      discountAmount = Math.min(subtotal, promo.discount_value);
      discountLabel = `LKR ${promo.discount_value.toLocaleString()} off`;
    } else if (promo.discount_type === 'shipping') {
      discountAmount = 0; // handled separately as free shipping
      discountLabel = 'Free shipping';
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      label: promo.label,
      discountLabel,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      discountAmount,   // actual LKR deduction (0 for shipping type)
      freeShipping: promo.discount_type === 'shipping',
      message: `✓ Code applied: ${promo.label}`,
    });
  } catch (err) {
    console.error('Promo validate error:', err);
    return NextResponse.json({ valid: false, message: 'Server error. Please try again.' }, { status: 500 });
  }
}
