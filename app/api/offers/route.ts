import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { normalizeProduct, ProductRow } from '@/lib/products';

export const dynamic = 'force-dynamic';

// Default values used if site_settings rows don't exist yet
const DEFAULTS = {
  free_shipping_threshold: 7500,
  shipping_fee: 350,
  free_shipping_badge_text: '',
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();

    // Fetch all offer data + site settings in parallel
    const [flashSaleRes, promoCodesRes, bundleDealsRes, saleItemsRes, settingsRes] =
      await Promise.all([
        // Active flash sale that hasn't ended yet
        supabase
          .from('flash_sales')
          .select('id, title, ends_at, badge_text, free_shipping_enabled')
          .eq('is_active', true)
          .gt('ends_at', now)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Active promo codes (not expired)
        supabase
          .from('promo_codes')
          .select('id, code, label, description, discount_type, discount_value, min_order, color, sort_order')
          .eq('is_active', true)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order('sort_order', { ascending: true }),

        // Active bundle deals
        supabase
          .from('bundle_deals')
          .select('id, title, description, saving_label, badge, product_ids, color, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),

        // Active sale items joined with full product details
        supabase
          .from('sale_items')
          .select('id, product_id, sale_percent, products(*)')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),

        // Site-wide settings
        supabase
          .from('site_settings')
          .select('key, value'),
      ]);

    // Build settings object from key-value rows
    const settingsMap: Record<string, string> = {};
    for (const row of settingsRes.data ?? []) {
      settingsMap[row.key] = row.value;
    }

    const settings = {
      freeShippingThreshold: parseInt(settingsMap.free_shipping_threshold ?? String(DEFAULTS.free_shipping_threshold), 10),
      shippingFee:           parseInt(settingsMap.shipping_fee ?? String(DEFAULTS.shipping_fee), 10),
      freeShippingBadgeText: settingsMap.free_shipping_badge_text ?? DEFAULTS.free_shipping_badge_text,
    };

    // Sale items: build a compact lookup { productId → salePercent }
    const saleItemRows = (saleItemsRes.data ?? []) as unknown as Array<{
      id: string;
      product_id: string;
      sale_percent: number;
      products: ProductRow | null;
    }>;
    const saleItems = saleItemRows.filter(
      (item) => item.products !== null
    ).map((item) => ({
      ...item,
      products: normalizeProduct(item.products as ProductRow),
    }));

    // Compact sale map for global use by product cards
    const saleMap: Record<string, number> = {};
    for (const item of saleItems) {
      saleMap[(item as { product_id: string }).product_id] =
        (item as { sale_percent: number }).sale_percent;
    }

    return NextResponse.json({
      flashSale: flashSaleRes.data ?? null,
      promoCodes: promoCodesRes.data ?? [],
      bundles: bundleDealsRes.data ?? [],
      saleItems,
      saleMap,      // { "hoodie-001": 20, "tee-001": 15, ... }
      settings,     // freeShippingThreshold, shippingFee, freeShippingBadgeText
    });
  } catch (err) {
    console.error('Offers GET error:', err);
    return NextResponse.json({
      flashSale: null,
      promoCodes: [],
      bundles: [],
      saleItems: [],
      saleMap: {},
      settings: {
        freeShippingThreshold: DEFAULTS.free_shipping_threshold,
        shippingFee: DEFAULTS.shipping_fee,
        freeShippingBadgeText: DEFAULTS.free_shipping_badge_text,
      },
    });
  }
}
