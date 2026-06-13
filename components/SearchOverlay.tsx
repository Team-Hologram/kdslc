'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ArrowRight, Hash } from 'lucide-react';
import { useOffers } from '@/contexts/OffersContext';
import { useProducts } from '@/contexts/ProductsContext';
import styles from './SearchOverlay.module.css';

interface Props {
  onClose: () => void;
}

export default function SearchOverlay({ onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { products } = useProducts();

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Filter products
  const q = query.trim().toLowerCase();
  const results = q.length > 0
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      ).slice(0, 8)
    : [];

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const suggestedCategories = q.length === 0 ? categories : [];

  const { getSalePrice } = useOffers();

  const handleSelect = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  // Helper: render price (sale or regular)
  const PriceDisplay = ({ id, price, formatted }: { id: string; price: number; formatted: string }) => {
    const s = getSalePrice(id, price);
    return s ? (
      <span className={styles.resultPriceWrap}>
        <span className={styles.resultPriceSale}>{s.salePriceFormatted}</span>
        <span className={styles.resultPriceOrig}>{formatted}</span>
      </span>
    ) : (
      <span className={styles.resultPrice}>{formatted}</span>
    );
  };

  return (
    <div
      className={styles.overlay}
      id="search-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Panel */}
      <div className={styles.panel}>
        {/* Input row */}
        <div className={styles.inputRow}>
          <Search size={18} className={styles.inputIcon} />
          <input
            ref={inputRef}
            id="search-input"
            type="text"
            className={styles.input}
            placeholder="Search products, categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')} aria-label="Clear">
              <X size={15} />
            </button>
          )}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close search" id="search-close">
            <X size={18} />
          </button>
        </div>

        {/* Results / suggestions */}
        <div className={styles.body}>

          {/* Search results */}
          {results.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Products ({results.length})</p>
              <div className={styles.resultsList}>
                {results.map((p) => (
                  <button
                    key={p.id}
                    className={styles.resultItem}
                    onClick={() => handleSelect(`/product/${p.id}`)}
                    id={`search-result-${p.id}`}
                  >
                    <div className={styles.resultImg}>
                      <Image src={p.image} alt={p.name} fill sizes="48px" className={styles.resultImage} />
                    </div>
                    <div className={styles.resultInfo}>
                      <span className={styles.resultCategory}>{p.category}</span>
                      <span className={styles.resultName}>{p.name}</span>
                    </div>
                    <PriceDisplay id={p.id} price={p.price} formatted={p.priceFormatted} />
                    <ArrowRight size={14} className={styles.resultArrow} />
                  </button>
                ))}
              </div>

              <button
                className={styles.viewAll}
                onClick={() => handleSelect(`/collections?q=${encodeURIComponent(q)}`)}
                id="search-view-all"
              >
                View all results for &ldquo;{query}&rdquo;
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* No results */}
          {q.length > 0 && results.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><Search size={28} /></div>
              <p className={styles.emptyTitle}>No results for &ldquo;{query}&rdquo;</p>
              <p className={styles.emptyText}>Try a different keyword or browse our categories.</p>
            </div>
          )}

          {/* Category suggestions (when no query) */}
          {suggestedCategories.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Browse Categories</p>
              <div className={styles.categories}>
                {suggestedCategories.map((cat) => (
                  <button
                    key={cat}
                    className={styles.catChip}
                    onClick={() => handleSelect(`/collections?category=${encodeURIComponent(cat)}`)}
                    id={`search-cat-${cat.toLowerCase()}`}
                  >
                    <Hash size={12} />
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular products (when no query) */}
          {q.length === 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Popular Items</p>
              <div className={styles.resultsList}>
                {products.filter((p) => p.isBestSeller || p.isNew).slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    className={styles.resultItem}
                    onClick={() => handleSelect(`/product/${p.id}`)}
                    id={`search-popular-${p.id}`}
                  >
                    <div className={styles.resultImg}>
                      <Image src={p.image} alt={p.name} fill sizes="48px" className={styles.resultImage} />
                    </div>
                    <div className={styles.resultInfo}>
                      <span className={styles.resultCategory}>{p.category}</span>
                      <span className={styles.resultName}>{p.name}</span>
                    </div>
                    <PriceDisplay id={p.id} price={p.price} formatted={p.priceFormatted} />
                    <ArrowRight size={14} className={styles.resultArrow} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className={styles.footer}>
          <span>Press <span className={styles.kbdKey}>Esc</span> to close</span>
          <Link href="/collections" className={styles.browseLink} onClick={onClose}>
            Browse all products →
          </Link>
        </div>
      </div>
    </div>
  );
}
