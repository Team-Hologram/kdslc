'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { Product, normalizeProduct } from '@/lib/products';
import { useAuth } from './AuthContext';
import { createClient } from '@/lib/supabase';

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
  dbId?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: string, color: string) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  syncing: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

type CartDbRow = {
  id: string;
  product_id: string;
  quantity: number;
  size: string;
  color: string;
  products: Product;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Always-current ref so effects can read items without stale closure issues
  const itemsRef = useRef<CartItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Track previous user ID — lets us detect the exact login/logout event
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // ── Logout ──
    if (!user) {
      prevUserIdRef.current = null;
      setItems([]);
      return;
    }

    // ── Same user session — skip (prevents repeated merge on unrelated re-renders) ──
    if (prevUserIdRef.current === user.id) return;

    // ── Login event — capture guest cart BEFORE it gets replaced ──
    const guestItems = [...itemsRef.current];
    prevUserIdRef.current = user.id;
    setSyncing(true);

    const mergeAndLoad = async () => {
      // Fetch existing DB cart for this user
      const { data: dbRows } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id);

      // Upload each guest item, merging quantities if same product+size+color exists
      const existingRows = (dbRows ?? []) as unknown as CartDbRow[];

      for (const gi of guestItems) {
        const existing = existingRows.find(
          (r) =>
            r.product_id === gi.product.id &&
            r.size === gi.size &&
            r.color === gi.color
        );

        if (existing) {
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + gi.quantity })
            .eq('id', existing.id);
        } else {
          await supabase.from('cart_items').insert({
            user_id: user.id,
            product_id: gi.product.id,
            size: gi.size,
            color: gi.color,
            quantity: gi.quantity,
          });
        }
      }

      // Reload the merged cart from DB
      const { data: merged } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id)
        .order('created_at');

      if (merged) {
        setItems(
          ((merged ?? []) as unknown as CartDbRow[]).map((row) => ({
            product: normalizeProduct(row.products),
            quantity: row.quantity,
            size: row.size,
            color: row.color,
            dbId: row.id,
          }))
        );
      }

      setSyncing(false);
    };

    mergeAndLoad();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = useCallback(
    async (product: Product, size: string, color: string) => {
      // Optimistic update
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.product.id === product.id && i.size === size
        );
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id && i.size === size
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        return [...prev, { product, quantity: 1, size, color }];
      });

      if (user) {
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .eq('size', size)
          .eq('color', color)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + 1 })
            .eq('id', existing.id);
        } else {
          const { data: newRow } = await supabase
            .from('cart_items')
            .insert({ user_id: user.id, product_id: product.id, size, color, quantity: 1 })
            .select('id')
            .single();
          if (newRow) {
            setItems((prev) =>
              prev.map((i) =>
                i.product.id === product.id && i.size === size && !i.dbId
                  ? { ...i, dbId: newRow.id }
                  : i
              )
            );
          }
        }
      }
    },
    [user, supabase]
  );

  const removeItem = useCallback(
    async (productId: string, size: string) => {
      const item = itemsRef.current.find(
        (i) => i.product.id === productId && i.size === size
      );
      setItems((prev) =>
        prev.filter((i) => !(i.product.id === productId && i.size === size))
      );
      if (user && item?.dbId) {
        await supabase.from('cart_items').delete().eq('id', item.dbId);
      }
    },
    [user, supabase]
  );

  const updateQuantity = useCallback(
    async (productId: string, size: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, size);
        return;
      }
      const item = itemsRef.current.find(
        (i) => i.product.id === productId && i.size === size
      );
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId && i.size === size ? { ...i, quantity } : i
        )
      );
      if (user && item?.dbId) {
        await supabase.from('cart_items').update({ quantity }).eq('id', item.dbId);
      }
    },
    [user, supabase, removeItem]
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
    }
  }, [user, supabase]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, syncing }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
