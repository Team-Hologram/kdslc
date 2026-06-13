'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { Product, normalizeProduct } from '@/lib/products';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductsContext';
import { createClient } from '@/lib/supabase';

interface WatchlistContextType {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isWatched: (productId: string) => boolean;
  count: number;
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { user } = useAuth();
  const { products } = useProducts();
  const [items, setItems] = useState<Product[]>([]);

  // Load watchlist from Supabase when user signs in
  useEffect(() => {
    if (!user) return;

    supabase
      .from('watchlist_items')
      .select('*, products(*)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setItems(data.map((row: { products: Product }) => normalizeProduct(row.products)));
        }
      });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear watchlist when user signs out
  useEffect(() => {
    if (!user) setItems([]);
  }, [user]);

  // Keep saved items synced with the latest product data from Supabase.
  useEffect(() => {
    if (products.length === 0) return;
    setItems((prev) =>
      prev.map((item) => products.find((product) => product.id === item.id) ?? item)
    );
  }, [products]);

  const addItem = useCallback(
    async (product: Product) => {
      setItems((prev) =>
        prev.find((p) => p.id === product.id) ? prev : [...prev, product]
      );
      if (user) {
        await supabase
          .from('watchlist_items')
          .upsert(
            { user_id: user.id, product_id: product.id },
            { onConflict: 'user_id,product_id' }
          );
      }
    },
    [user, supabase]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      setItems((prev) => prev.filter((p) => p.id !== productId));
      if (user) {
        await supabase
          .from('watchlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
      }
    },
    [user, supabase]
  );

  const isWatched = useCallback(
    (productId: string) => items.some((p) => p.id === productId),
    [items]
  );

  return (
    <WatchlistContext.Provider
      value={{ items, addItem, removeItem, isWatched, count: items.length }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}
