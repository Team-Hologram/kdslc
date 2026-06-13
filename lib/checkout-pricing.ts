type CheckoutItemInput = {
  product_id?: string;
  size?: string;
  color?: string;
  quantity?: number;
};

export type PricedOrderItem = {
  product_id: string;
  name: string;
  image: string | null;
  size: string;
  color: string;
  quantity: number;
  price: number;
  original_price: number;
  sale_percent: number | null;
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
  image: string | null;
};

type SaleRow = {
  product_id: string;
  sale_percent: number;
};

function readSetting(rows: Array<{ key: string; value: string }>, key: string, fallback: number) {
  const value = rows.find((row) => row.key === key)?.value;
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function priceCheckoutOrder(supabase: any, body: any) {
  const requestedItems = Array.isArray(body.items) ? body.items as CheckoutItemInput[] : [];
  const normalizedInputs = requestedItems
    .map((item) => ({
      product_id: item.product_id,
      size: item.size ?? '',
      color: item.color ?? '',
      quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
    }))
    .filter((item): item is Required<CheckoutItemInput> => Boolean(item.product_id));

  if (normalizedInputs.length === 0) {
    return { error: 'Cart is empty', status: 400 as const };
  }

  const productIds = Array.from(new Set(normalizedInputs.map((item) => item.product_id)));
  const now = new Date().toISOString();
  const [productsRes, salesRes, settingsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, price, image, is_active')
      .in('id', productIds)
      .eq('is_active', true),
    supabase
      .from('sale_items')
      .select('product_id, sale_percent')
      .in('product_id', productIds)
      .eq('is_active', true),
    supabase
      .from('site_settings')
      .select('key, value'),
  ]);

  if (productsRes.error) throw productsRes.error;
  if (salesRes.error) throw salesRes.error;
  if (settingsRes.error) throw settingsRes.error;

  const productMap = new Map<string, ProductRow>(
    ((productsRes.data ?? []) as ProductRow[]).map((product) => [product.id, product])
  );
  const saleMap = new Map<string, number>(
    ((salesRes.data ?? []) as SaleRow[]).map((sale) => [sale.product_id, sale.sale_percent])
  );

  if (productMap.size !== productIds.length) {
    return { error: 'One or more products are no longer available', status: 409 as const };
  }

  const pricedItems: PricedOrderItem[] = normalizedInputs.map((item) => {
    const product = productMap.get(item.product_id)!;
    const salePercent = saleMap.get(item.product_id) ?? null;
    const unitPrice = salePercent
      ? Math.round(product.price * (1 - salePercent / 100))
      : product.price;

    return {
      product_id: product.id,
      name: product.name,
      image: product.image,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: unitPrice,
      original_price: product.price,
      sale_percent: salePercent,
    };
  });

  const subtotal = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discount_amount = 0;
  let freeShipping = false;
  let finalPromoCode: string | null = null;

  if (body.promo_code) {
    const { data: promo, error: promoError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', String(body.promo_code).trim().toUpperCase())
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle();

    if (promoError) throw promoError;
    if (!promo) return { error: 'Promo code is no longer valid', status: 409 as const };
    if (promo.min_order > 0 && subtotal < promo.min_order) {
      return { error: `Minimum order of LKR ${promo.min_order.toLocaleString('en-LK')} required for this promo code`, status: 409 as const };
    }

    finalPromoCode = promo.code;
    if (promo.discount_type === 'percentage') {
      discount_amount = Math.round(subtotal * promo.discount_value / 100);
    } else if (promo.discount_type === 'fixed') {
      discount_amount = Math.min(subtotal, promo.discount_value);
    } else if (promo.discount_type === 'shipping' || promo.discount_type === 'free_shipping') {
      freeShipping = true;
    }
  }

  const settingsRows = (settingsRes.data ?? []) as Array<{ key: string; value: string }>;
  const freeShippingThreshold = readSetting(settingsRows, 'free_shipping_threshold', 7500);
  const configuredShippingFee = readSetting(settingsRows, 'shipping_fee', 350);
  const discountedSubtotal = Math.max(0, subtotal - discount_amount);
  const shipping_fee = freeShipping || discountedSubtotal >= freeShippingThreshold ? 0 : configuredShippingFee;
  const total = discountedSubtotal + shipping_fee;

  return {
    pricedItems,
    subtotal,
    shipping_fee,
    promo_code: finalPromoCode,
    discount_amount,
    total,
  };
}
