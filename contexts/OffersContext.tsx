'use client';
/**
 * OffersContext
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches /api/offers once on app mount and provides:
 *   • saleMap:               { productId → salePercent }
 *   • getSalePrice(id, price) → { salePrice, originalPrice, percent } | null
 *   • settings:              { freeShippingThreshold, shippingFee, ... }
 *   • flashSale:             current flash sale (or null)
 *   • promoCodes / bundles / saleItems: raw DB data for the Offers page
 *
 * All product price displays + cart/checkout shipping logic should
 * read from this context instead of using hardcoded values.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { createContext, useCallback, useContext, useRef, useState, useEffect } from 'react';
import { Product } from '@/lib/products';
import { subscribeDataChanged } from '@/lib/client-data-events';

/* ── Types ── */
export interface SalePriceInfo {
  salePrice: number;       // discounted price
  originalPrice: number;   // full price
  percent: number;         // e.g. 20
  salePriceFormatted: string;
  originalFormatted: string;
}

export interface SiteSettings {
  freeShippingThreshold: number;  // e.g. 7500
  shippingFee: number;            // e.g. 350
  freeShippingBadgeText: string;  // e.g. "Free shipping today" or "" to hide
}

interface FlashSale {
  id: string;
  title: string;
  ends_at: string;
  badge_text: string;
  free_shipping_enabled: boolean;
}

interface PromoCode {
  id: string; code: string; label: string; description: string;
  discount_type: string; discount_value: number; min_order: number;
  color: string; sort_order: number;
}

interface BundleDeal {
  id: string; title: string; description: string; saving_label: string;
  badge: string; product_ids: string[]; color: string; sort_order: number;
}

interface SaleItem {
  id: string; product_id: string; sale_percent: number;
  products: Product;
}

interface OffersContextValue {
  /* Sale pricing */
  saleMap: Record<string, number>;        // { productId → salePercent }
  getSalePrice: (productId: string, originalPrice: number) => SalePriceInfo | null;

  /* Site settings */
  settings: SiteSettings;

  /* Raw offers data (used by /offers page) */
  flashSale: FlashSale | null;
  promoCodes: PromoCode[];
  bundles: BundleDeal[];
  saleItems: SaleItem[];

  loading: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  freeShippingThreshold: 7500,
  shippingFee: 350,
  freeShippingBadgeText: '',
};
const OFFERS_STALE_MS = 60_000;
const OFFERS_TIMEOUT_MS = 8_000;

const OffersCtx = createContext<OffersContextValue>({
  saleMap: {},
  getSalePrice: () => null,
  settings: DEFAULT_SETTINGS,
  flashSale: null,
  promoCodes: [],
  bundles: [],
  saleItems: [],
  loading: true,
});

/* ── Helper: format price as "LKR 6,800" ── */
function fmtPrice(n: number): string {
  return `LKR ${n.toLocaleString('en-LK')}`;
}

export function OffersProvider({ children }: { children: React.ReactNode }) {
  const [saleMap, setSaleMap] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [bundles, setBundles] = useState<BundleDeal[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const lastLoadedRef = useRef(0);
  const inflightRef = useRef(false);

  const loadOffers = useCallback((force = false) => {
    const now = Date.now();
    if (inflightRef.current || (!force && now - lastLoadedRef.current < OFFERS_STALE_MS)) return;

    inflightRef.current = true;
    if (lastLoadedRef.current === 0) setLoading(true);
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Offers request timed out')), OFFERS_TIMEOUT_MS);
    });

    Promise.race([
      fetch('/api/offers', { cache: 'no-store' }),
      timeout,
    ])
      .then((r) => r.json())
      .then((data) => {
        lastLoadedRef.current = Date.now();
        setSaleMap(data?.saleMap ?? {});
        setSettings(data?.settings ?? DEFAULT_SETTINGS);
        setFlashSale(data?.flashSale ?? null);
        setPromoCodes(Array.isArray(data?.promoCodes) ? data.promoCodes : []);
        setBundles(Array.isArray(data?.bundles) ? data.bundles : []);
        setSaleItems(Array.isArray(data?.saleItems) ? data.saleItems : []);
      })
      .catch(() => { /* keep defaults */ })
      .finally(() => {
        inflightRef.current = false;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadOffers(true);
  }, [loadOffers]);

  useEffect(() => {
    const refreshIfStale = () => loadOffers(false);
    const refreshNow = () => loadOffers(true);

    window.addEventListener('focus', refreshIfStale);
    const unsubscribeDataChanged = subscribeDataChanged(refreshNow);
    return () => {
      window.removeEventListener('focus', refreshIfStale);
      unsubscribeDataChanged();
    };
  }, [loadOffers]);

  const getSalePrice = (productId: string, originalPrice: number): SalePriceInfo | null => {
    const percent = saleMap[productId];
    if (!percent) return null;
    const salePrice = Math.round(originalPrice * (1 - percent / 100));
    return {
      salePrice,
      originalPrice,
      percent,
      salePriceFormatted: fmtPrice(salePrice),
      originalFormatted: fmtPrice(originalPrice),
    };
  };

  return (
    <OffersCtx.Provider value={{
      saleMap,
      getSalePrice,
      settings,
      flashSale,
      promoCodes,
      bundles,
      saleItems,
      loading,
    }}>
      {children}
    </OffersCtx.Provider>
  );
}

export const useOffers = () => useContext(OffersCtx);
