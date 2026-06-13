'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Heart, ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { Product } from '@/lib/products';
import { useCart } from '@/contexts/CartContext';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { useOffers } from '@/contexts/OffersContext';
import styles from './QuickViewModal.module.css';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();
  const { addItem: addToWatchlist, removeItem: removeFromWatchlist, isWatched } = useWatchlist();
  const { getSalePrice } = useOffers();

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[1] ?? product.sizes[0]);
      setSelectedColor(product.colors[0]?.name ?? '');
      setAddedToCart(false);
    }
  }, [product]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  if (!product) return null;

  const watched = isWatched(product.id);
  const sale = getSalePrice(product.id, product.price);

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem(product, selectedSize, selectedColor);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const toggleWatchlist = () => {
    if (watched) removeFromWatchlist(product.id);
    else addToWatchlist(product);
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()} id="quick-view-overlay">
      <div className={styles.modal} id="quick-view-modal">
        {/* Image — close button lives here so it never overlaps info content */}
        <div className={styles.imageSide}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={styles.img}
            sizes="40vw"
          />
          <div className={styles.imageOverlay} />
          {product.tag && (
            <span className={styles.tag}>{product.tag}</span>
          )}
          {/* Close is anchored to the image side top-right — completely separate from watchlist */}
          <button className={styles.closeBtn} onClick={onClose} id="quick-view-close" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Info */}
        <div className={styles.infoSide}>
          <div className={styles.header}>
            <span className={styles.category}>{product.category}</span>
            {/* Watchlist is in info header — no longer near the X button */}
            <button
              className={`${styles.wishBtn} ${watched ? styles.wishBtnActive : ''}`}
              onClick={toggleWatchlist}
              id={`quick-view-wish-${product.id}`}
              aria-label="Toggle watchlist"
            >
              <Heart size={15} fill={watched ? 'currentColor' : 'none'} />
            </button>
          </div>

          <h2 className={styles.name}>{product.name}</h2>

          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  fill={i < Math.floor(product.rating) ? '#F5A623' : 'none'}
                  stroke={i < Math.floor(product.rating) ? '#F5A623' : '#ccc'}
                />
              ))}
            </div>
            <span className={styles.reviewCount}>{product.reviews} reviews</span>
          </div>

          {sale ? (
            <div className={styles.priceBlock}>
              <div className={styles.price}>{sale.salePriceFormatted}</div>
              <div className={styles.priceOriginal}>{sale.originalFormatted}</div>
            </div>
          ) : (
            <div className={styles.price}>{product.priceFormatted}</div>
          )}

          <p className={styles.description}>{product.description}</p>

          {/* Color */}
          <div className={styles.optionGroup}>
            <label className={styles.optionLabel}>
              Color: <span className={styles.optionValue}>{selectedColor}</span>
            </label>
            <div className={styles.colorSwatches}>
              {product.colors.map((c) => {
                const isLight = ['#ffffff', '#fff', '#fafafa', '#f5f5f5', '#fffaf7'].includes(c.hex.toLowerCase());
                return (
                  <button
                    key={c.name}
                    className={`${styles.colorSwatch} ${selectedColor === c.name ? styles.swatchActive : ''} ${isLight ? styles.swatchLight : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setSelectedColor(c.name)}
                    title={c.name}
                    id={`quick-view-color-${c.name.replace(/\s/g, '-').toLowerCase()}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Size */}
          <div className={styles.optionGroup}>
            <label className={styles.optionLabel}>Size</label>
            <div className={styles.sizes}>
              {product.sizes.map((s) => (
                <button
                  key={s}
                  className={`${styles.sizeBtn} ${selectedSize === s ? styles.sizeBtnActive : ''}`}
                  onClick={() => setSelectedSize(s)}
                  id={`quick-view-size-${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className={styles.actions}>
            <button
              className={`btn-primary ${styles.addCartBtn} ${addedToCart ? styles.addedBtn : ''}`}
              onClick={handleAddToCart}
              id="quick-view-add-cart"
              disabled={addedToCart}
            >
              <ShoppingBag size={16} />
              <span>{addedToCart ? 'Added to Cart!' : 'Add to Cart'}</span>
            </button>
            <Link
              href={`/product/${product.id}`}
              className="btn-outline"
              onClick={onClose}
              id="quick-view-full-page"
            >
              <span>Full Details</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Details */}
          <div className={styles.details}>
            {product.details.map((d) => (
              <div key={d} className={styles.detailItem}>
                <span className={styles.detailDot}>✦</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
