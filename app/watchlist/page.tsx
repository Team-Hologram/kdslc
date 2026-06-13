'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, X, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { useCart } from '@/contexts/CartContext';
import { useOffers } from '@/contexts/OffersContext';
import styles from './watchlist.module.css';

export default function WatchlistPage() {
  const { items, removeItem } = useWatchlist();
  const { addItem } = useCart();
  const { getSalePrice } = useOffers();

  const handleAddToCart = (productId: string) => {
    const product = items.find((p) => p.id === productId);
    if (product) {
      addItem(product, product.sizes[1] ?? product.sizes[0], product.colors[0]?.name ?? '');
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <Link href="/collections" className={styles.backLink} id="watchlist-back">
              <ArrowLeft size={16} />
              <span>Continue Shopping</span>
            </Link>
            <h1 className={styles.title}>
              Saved <em className={styles.titleAccent}>Items</em>
            </h1>
            <span className={styles.count}>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
          </div>

          {items.length === 0 ? (
            <div className={styles.empty} id="watchlist-empty">
              <div className={styles.emptyIcon}><Heart size={48} strokeWidth={1} /></div>
              <h2 className={styles.emptyTitle}>Your watchlist is empty</h2>
              <p className={styles.emptyText}>Save your favourite pieces and come back to them whenever you're ready.</p>
              <Link href="/collections" className="btn-primary" id="watchlist-shop-now">
                <span>Discover Collections</span>
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {items.map((product) => (
                <div key={product.id} className={styles.card} id={`watchlist-item-${product.id}`}>
                  <Link href={`/product/${product.id}`} className={styles.imageWrap}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className={styles.image}
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className={styles.overlay} />
                    {product.tag && <span className={styles.tag}>{product.tag}</span>}
                  </Link>

                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(product.id)}
                    id={`watchlist-remove-${product.id}`}
                    aria-label="Remove from watchlist"
                  >
                    <X size={14} />
                  </button>

                  <div className={styles.info}>
                    <span className={styles.category}>{product.category}</span>
                    <Link href={`/product/${product.id}`} className={styles.name}>{product.name}</Link>
                    <div className={styles.bottom}>
                      {(() => {
                        const sale = getSalePrice(product.id, product.price);
                        return sale ? (
                          <span className={styles.priceStack}>
                            <span className={styles.salePrice}>{sale.salePriceFormatted}</span>
                            <span className={styles.originalPrice}>{sale.originalFormatted}</span>
                          </span>
                        ) : (
                          <span className={styles.price}>{product.priceFormatted}</span>
                        );
                      })()}
                      <button
                        className={styles.cartBtn}
                        onClick={() => handleAddToCart(product.id)}
                        id={`watchlist-cart-${product.id}`}
                        aria-label="Add to cart"
                      >
                        <ShoppingBag size={14} />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
