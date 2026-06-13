import crypto from 'crypto';

export type PaymentMethod = 'card' | 'paypal' | 'bank_transfer';

export const PAYMENT_METHODS: PaymentMethod[] = ['card', 'paypal', 'bank_transfer'];

export function normalizePaymentMethod(value: unknown): PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod) ? value as PaymentMethod : 'card';
}

function md5Upper(value: string) {
  return crypto.createHash('md5').update(value).digest('hex').toUpperCase();
}

export function createPayHereHash(params: {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  merchantSecret: string;
}) {
  const secretHash = md5Upper(params.merchantSecret);
  return md5Upper(`${params.merchantId}${params.orderId}${params.amount}${params.currency}${secretHash}`);
}

export function createPayHereNotifyHash(params: {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  statusCode: string;
  merchantSecret: string;
}) {
  const secretHash = md5Upper(params.merchantSecret);
  return md5Upper(`${params.merchantId}${params.orderId}${params.amount}${params.currency}${params.statusCode}${secretHash}`);
}

export function paypalBaseUrl() {
  return process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
}

export function paypalCurrency() {
  return process.env.PAYPAL_CURRENCY ?? 'USD';
}

export function lkrToPaypalAmount(totalLkr: number) {
  const rate = Number(process.env.PAYPAL_LKR_TO_USD_RATE ?? '0.0034');
  return Math.max(0.01, totalLkr * rate).toFixed(2);
}

export async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('PayPal credentials are not configured');

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? 'Could not authenticate with PayPal');
  return data.access_token as string;
}
