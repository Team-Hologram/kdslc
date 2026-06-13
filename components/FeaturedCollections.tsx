'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, ShoppingBag, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/lib/products';
import { useCart } from '@/contexts/CartContext';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { useOffers } from '@/contexts/OffersContext';
import { useProducts } from '@/contexts/ProductsContext';
import QuickViewModal from './QuickViewModal';
import styles from './FeaturedCollections.module.css';

export default function FeaturedCollections() {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const { addItem } = useCart();
  const { addItem: addToWatchlist, removeItem, isWatched } = useWatchlist();
  const { getSalePrice } = useOffers();
  const { products } = useProducts();
  
  const selectedFeatured = products.filter((product) => product.isFeatured);
  const featured = selectedFeatured.length > 0 ? selectedFeatured : products.slice(0, 4);
  
  // Extend the array to 3 full sets for infinite scrolling
  const extendedFeatured = [...featured, ...featured, ...featured];

  // Carousel logic
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Start the carousel in the middle set to allow left scrolling immediately
  useEffect(() => {
    if (featured.length === 0) return;
    if (carouselRef.current && carouselRef.current.children.length >= featured.length * 3) {
      const secondSetStart = carouselRef.current.children[featured.length] as HTMLElement;
      carouselRef.current.scrollLeft = secondSetStart.offsetLeft;
    }
  }, [featured.length]);

  const handleScroll = useCallback(() => {
    if (!carouselRef.current) return;
    
    // Clear the timeout to ensure we only jump when scrolling has completely stopped
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    
    scrollTimeout.current = setTimeout(() => {
      const container = carouselRef.current;
      if (!container || featured.length === 0 || container.children.length < featured.length * 3) return;
      
      const singleSetWidth = (container.children[featured.length] as HTMLElement).offsetLeft;
      
      // If scrolled deep into the 3rd set, silently jump back to the 2nd set
      if (container.scrollLeft >= singleSetWidth * 2 - 100) {
        container.scrollLeft = container.scrollLeft - singleSetWidth;
      } 
      // If scrolled back into the 1st set, silently jump forward to the 2nd set
      else if (container.scrollLeft <= 100) {
        container.scrollLeft = container.scrollLeft + singleSetWidth;
      }
    }, 150);
  }, [featured.length]);

  const scrollCarousel = useCallback((dir: 'left' | 'right') => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const scrollAmount = viewportWidth > 768 ? 400 : 250;
    const delta = dir === 'left' ? -scrollAmount : scrollAmount;
    const nextLeft = carousel.scrollLeft + delta;

    carousel.scrollLeft = nextLeft;
  }, []);

  useEffect(() => {
    if (isHovered || quickViewProduct || featured.length === 0) return;
    const id = setInterval(() => {
      scrollCarousel('right');
    }, 4500);
    return () => clearInterval(id);
  }, [isHovered, quickViewProduct, featured.length, scrollCarousel]);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, product.sizes[1] ?? product.sizes[0], product.colors[0]?.name ?? '');
  };

  const toggleWatchlist = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWatched(product.id)) removeItem(product.id);
    else addToWatchlist(product);
  };

  const handleProductLinkClick = (e: React.MouseEvent, cardKey: string) => {
    const isTouchLayout = window.matchMedia?.('(hover: none)').matches || window.innerWidth <= 768;
    if (isTouchLayout && activeCard !== cardKey) {
      e.preventDefault();
      setActiveCard(cardKey);
      return;
    }
    setActiveCard(null);
  };

  if (featured.length === 0) return null;

  return (
    <>
      <section className={styles.section} id="featured-collections">
        <div className="container">
          <div className={styles.header}>
            <div>
              <span className="section-tag">Collections</span>
              <h2 className={styles.title}>
                Featured <em className={styles.titleAccent}>Pieces</em>
              </h2>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.carouselControls}>
                <button 
                  className={styles.carouselArrow} 
                  onClick={() => scrollCarousel('left')} 
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  className={styles.carouselArrow} 
                  onClick={() => scrollCarousel('right')} 
                  aria-label="Scroll right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <Link href="/collections" className="btn-outline" id="featured-view-all">
                <span>View All</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <div 
            className={styles.grid}
            ref={carouselRef}
            onScroll={handleScroll}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
          >
            {extendedFeatured.map((product, index) => {
              const cardKey = `${product.id}-${index}`;
              const sale = getSalePrice(product.id, product.price);
              return (
              <div
                key={cardKey}
                className={`${styles.card} ${activeCard === cardKey ? styles.cardActive : ''}`}
                id={`featured-card-${cardKey}`}
              >
                <div className={`${styles.imageWrap} ${sale ? styles.imageWrapSale : ''}`}>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <Link
                    href={`/product/${product.id}`}
                    className={styles.imageLink}
                    aria-label={`View ${product.name}`}
                    onClick={(e) => handleProductLinkClick(e, cardKey)}
                  />
                  <div className={styles.overlay} />
                  {product.tag && <span className={styles.tag}>{product.tag}</span>}
                  {/* Sale badge */}
                  {sale ? <span className={styles.saleBadge}>-{sale.percent}%</span> : null}

                  {/* Hover Actions */}
                  <div className={styles.cardActions}>
                    <button
                      className={`${styles.actionBtn} ${isWatched(product.id) ? styles.actionBtnActive : ''}`}
                      onClick={(e) => toggleWatchlist(e, product)}
                      aria-label="Add to watchlist"
                      id={`featured-wish-${product.id}`}
                    >
                      <Heart size={15} fill={isWatched(product.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewProduct(product); setActiveCard(null); }}
                      aria-label="Quick view"
                      id={`featured-qv-${cardKey}`}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => handleQuickAdd(e, product)}
                      aria-label="Add to cart"
                      id={`featured-cart-${cardKey}`}
                    >
                      <ShoppingBag size={15} />
                    </button>
                  </div>

                  {/* Quick View bottom */}
                  <button
                    className={styles.quickView}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewProduct(product); setActiveCard(null); }}
                    id={`featured-quick-view-${cardKey}`}
                  >
                    Quick View
                  </button>
                </div>

                <div className={styles.info}>
                  <span className={styles.category}>{product.category}</span>
                  <h3 className={styles.name}>{product.name}</h3>
                  <div className={styles.priceRow}>
                    {(() => {
                      return sale ? (
                        <>
                          <span className={styles.priceSale}>{sale.salePriceFormatted}</span>
                          <span className={styles.priceOriginal}>{sale.originalFormatted}</span>
                        </>
                      ) : (
                        <span className={styles.price}>{product.priceFormatted}</span>
                      );
                    })()}
                    <div className={styles.sizes}>
                      {product.sizes.slice(0, 3).map((s) => (
                        <span key={s} className={styles.size}>{s}</span>
                      ))}
                      {product.sizes.length > 3 && <span className={styles.size}>+{product.sizes.length - 3}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}
