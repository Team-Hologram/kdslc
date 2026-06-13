'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Product, normalizeProducts, products as seededProducts } from '@/lib/products';
import { subscribeDataChanged } from '@/lib/client-data-events';

const PRODUCTS_STALE_MS = 60_000;
const HAS_SEEDED_PRODUCTS = seededProducts.length > 0;

interface ProductsContextValue {
  products: Product[];
  loading: boolean;
  error: string;
  getProductById: (id: string) => Product | undefined;
  getRelatedProducts: (id: string, category: string) => Product[];
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => seededProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lastLoadedRef = useRef(0);
  const inflightRef = useRef(false);

  const loadProducts = useCallback((force = false) => {
    const now = Date.now();
    if (inflightRef.current || (!force && now - lastLoadedRef.current < PRODUCTS_STALE_MS)) return;

    let active = true;
    inflightRef.current = true;
    if (lastLoadedRef.current === 0 && !HAS_SEEDED_PRODUCTS) setLoading(true);

    fetch('/api/products', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to fetch products');
        return normalizeProducts(data.products);
      })
      .then((nextProducts) => {
        if (!active) return;
        lastLoadedRef.current = Date.now();
        setProducts(nextProducts);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      })
      .finally(() => {
        inflightRef.current = false;
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      inflightRef.current = false;
    };
  }, []);

  useEffect(() => loadProducts(true), [loadProducts]);

  useEffect(() => {
    const refreshIfStale = () => { loadProducts(false); };
    const refreshNow = () => { loadProducts(true); };

    window.addEventListener('focus', refreshIfStale);
    const unsubscribeDataChanged = subscribeDataChanged(refreshNow);
    return () => {
      window.removeEventListener('focus', refreshIfStale);
      unsubscribeDataChanged();
    };
  }, [loadProducts]);

  const value = useMemo<ProductsContextValue>(() => ({
    products,
    loading,
    error,
    getProductById: (id) => products.find((product) => product.id === id),
    getRelatedProducts: (id, category) =>
      products
        .filter((product) => product.id !== id && product.category === category)
        .slice(0, 4),
  }), [products, loading, error]);

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used inside ProductsProvider');
  return ctx;
}
