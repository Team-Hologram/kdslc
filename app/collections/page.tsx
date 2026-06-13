'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import QuickViewModal from '@/components/QuickViewModal';
import { Product } from '@/lib/products';
import { useCart } from '@/contexts/CartContext';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { useOffers } from '@/contexts/OffersContext';
import { useProducts } from '@/contexts/ProductsContext';
import styles from './collections.module.css';

const FILTERS = ['All', 'Hoodies', 'T-Shirts', 'Sets', 'Jackets'];
const SORTS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest'];

// Sticky top: distance below viewport top where sidebar/resultsBar stick
const STICKY_TOP = 100;
// gridSection padding-top (matches CSS)
const SECTION_PT = 40;
// Approx height of the resultsBar row
const RESULTSBAR_H = 48;

const safeScrollTo = (top: number) => {
  window.scrollTo(0, top);
};

function CollectionsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSort, setActiveSort] = useState('Featured');
  const [sortOpen, setSortOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [showMask, setShowMask] = useState(false);
  const isFirstRender = useRef(true);
  const gridRef = useRef<HTMLDivElement>(null);

  const { addItem } = useCart();
  const { addItem: addToWatchlist, removeItem: removeFromWatchlist, isWatched } = useWatchlist();
  const { getSalePrice } = useOffers();
  const { products, loading } = useProducts();

  useEffect(() => {
    const syncFilterFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const category = params.get('category') ?? 'All';
      setActiveFilter(FILTERS.includes(category) ? category : 'All');
    };

    syncFilterFromUrl();
    window.addEventListener('popstate', syncFilterFromUrl);
    return () => window.removeEventListener('popstate', syncFilterFromUrl);
  }, []);

  const filtered = useMemo(() => {
    let f = activeFilter === 'All'
      ? products
      : products.filter((p) => p.category === activeFilter);
    if (activeSort === 'Price: Low to High') f = [...f].sort((a, b) => a.price - b.price);
    if (activeSort === 'Price: High to Low') f = [...f].sort((a, b) => b.price - a.price);
    return f;
  }, [activeFilter, activeSort, products]);

  // On filter/sort change: scroll to the top of the product grid so users
  // always see the results from the beginning (fixes the "half-grid" problem).
  const changeFilter = (f: string) => {
    setActiveFilter(f);
    const nextUrl = f === 'All' ? '/collections' : `/collections?category=${encodeURIComponent(f)}`;
    window.history.pushState({}, '', nextUrl);
  };
  const changeSort = (s: string) => { setActiveSort(s); };

  const gridSectionRef = useRef<HTMLDivElement>(null);

  // Scroll-to-grid effect: runs whenever filter or sort changes (not on mount)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const grid = gridRef.current;
    if (!grid) return;
    // Use the element's absolute offsetTop from document top (not viewport-relative getBoundingClientRect)
    let el: HTMLElement | null = grid;
    let absTop = 0;
    while (el) { absTop += el.offsetTop; el = el.offsetParent as HTMLElement | null; }
    safeScrollTo(Math.max(0, absTop - 100));
  }, [activeFilter, activeSort]);

  // Scroll to top on first mount so hero is always visible when navigating to /collections
  useEffect(() => {
    safeScrollTo(0);
  }, []);

  // ── Navbar-mask visibility ────────────────────────────────────────────────
  //
  // The sidebar and resultsBar are individually sticky at top: STICKY_TOP.
  // Between the navbar bottom (~74px) and STICKY_TOP (82px) + resultsBar
  // height (~48px) there is a zone where product cards would scroll through
  // visibly.  A fixed mask div (z-index between products and sticky elements)
  // covers that zone while the sticky section is in view.
  //
  // stickyStart: scroll position where sticky elements first pin
  // stickyEnd:   scroll position where they release (gridSection bottom)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const section = gridSectionRef.current;
    if (!section) return;

    const handleScroll = () => {
      const stickyStart = section.offsetTop + SECTION_PT - STICKY_TOP;
      // Release point: when bottom of containing block minus sticky height passes viewport
      const stickyEnd = section.offsetTop + section.offsetHeight - RESULTSBAR_H - STICKY_TOP;
      const { scrollY } = window;
      setShowMask(scrollY >= stickyStart && scrollY < stickyEnd);
    };

    handleScroll(); // initialise on mount
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, product.sizes[1] ?? product.sizes[0], product.colors[0]?.name ?? '');
  };

  const toggleWatchlist = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWatched(product.id)) removeFromWatchlist(product.id);
    else addToWatchlist(product);
  };

  const openQuickView = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
    setActiveCard(null);
  };

  const handleProductLinkClick = (e: React.MouseEvent, productId: string) => {
    const isTouchLayout = window.matchMedia?.('(hover: none)').matches || window.innerWidth <= 768;
    if (isTouchLayout && activeCard !== productId) {
      e.preventDefault();
      setActiveCard(productId);
      return;
    }
    setActiveCard(null);
  };

  return (
    <>
      <Navbar />

      {/*
        Gap-blocker mask:
        - position:fixed, covers from top to below the sticky results bar
        - z-index:5 → above products (auto), below resultsBar (9), sidebar (10), navbar (1000)
        - pointer-events:none → doesn't block clicks on sidebar/resultsBar
        - opacity controlled by showMask → only visible while sticky zone is active
      */}
      <div
        className={`${styles.navbarMask} ${showMask ? styles.navbarMaskVisible : ''}`}
        aria-hidden="true"
      />

      <main className={styles.main}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerBg} />
          <div className="container">
            <span className="section-tag">Collections</span>
            <h1 className={styles.pageTitle}>
              The Full <em className={styles.titleAccent}>Edit</em>
            </h1>
            <p className={styles.pageSubtitle}>
              Every piece, every story. Shop the complete KDSL Clothing range.
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className={styles.gridSection} ref={gridSectionRef}>
          <div className="container">
            <div className={styles.gridLayout}>

              {/* LEFT: Filter sidebar — individually sticky */}
              <aside className={styles.filterSidebar} id="collections-filter-sidebar">
                <span className={styles.sidebarLabel}>Filter</span>
                <div className={styles.sidebarDivider} />
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    className={`${styles.sidebarTab} ${activeFilter === f ? styles.sidebarActive : ''}`}
                    onClick={() => changeFilter(f)}
                    id={`filter-${f.toLowerCase().replace(/[^a-z]/g, '-')}`}
                  >
                    {f}
                    {activeFilter === f && (
                      <span className={styles.sidebarCount}>
                        {f === 'All' ? products.length : products.filter((p) => p.category === f).length}
                      </span>
                    )}
                  </button>
                ))}
              </aside>

              {/* RIGHT: results bar (sticky) + product grid */}
              <div className={styles.gridContent}>

                {/* Results bar — individually sticky at same level as sidebar */}
                <div className={styles.resultsBar}>
                  <span className={styles.resultsCount}>{filtered.length} products</span>
                  <div className={styles.sortWrap}>
                    <button
                      className={styles.sortBtn}
                      onClick={() => setSortOpen((o) => !o)}
                      id="collections-sort"
                    >
                      <SlidersHorizontal size={14} />
                      <span>{activeSort}</span>
                    </button>
                    {sortOpen && (
                      <div className={styles.sortDropdown} id="sort-dropdown">
                        {SORTS.map((s) => (
                          <button
                            key={s}
                            className={`${styles.sortOption} ${activeSort === s ? styles.sortOptionActive : ''}`}
                            onClick={() => { changeSort(s); setSortOpen(false); }}
                            id={`sort-${s.toLowerCase().replace(/[^a-z]/g, '-')}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile-only horizontal scrollable filter tabs (desktop sidebar hidden on mobile) */}
                <div className={styles.mobileFilterBar}>
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      className={`${styles.mobileFTab} ${activeFilter === f ? styles.mobileFTabActive : ''}`}
                      onClick={() => changeFilter(f)}
                      id={`mobile-filter-${f.toLowerCase().replace(/[^a-z]/g, '-')}`}
                    >
                      {f}
                      {activeFilter === f && (
                        <span className={styles.mobileFTabCount}>
                          {f === 'All' ? products.length : products.filter((p) => p.category === f).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Product grid */}
                <div className={styles.grid} ref={gridRef} id="collections-products-grid">
                  {loading && (
                    <div className={styles.noResults} id="collections-loading">
                      <p>Loading products...</p>
                    </div>
                  )}

                  {!loading && filtered.map((product) => (
                    <div
                      key={product.id}
                      className={`${styles.card} ${activeCard === product.id ? styles.cardActive : ''}`}
                      id={`product-${product.id}`}
                    >
                      <div className={styles.imageWrap}>
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className={styles.image}
                          sizes="(max-width: 768px) 50vw, 22vw"
                        />
                        <Link
                          href={`/product/${product.id}`}
                          className={styles.imageLink}
                          aria-label={`View ${product.name}`}
                          onClick={(e) => handleProductLinkClick(e, product.id)}
                        />
                        <div className={styles.overlay} />
                        {product.tag && <span className={styles.tag}>{product.tag}</span>}

                        <div className={styles.cardActions}>
                          <button
                            className={`${styles.actionBtn} ${isWatched(product.id) ? styles.actionBtnWished : ''}`}
                            onClick={(e) => toggleWatchlist(e, product)}
                            aria-label="Add to watchlist"
                            id={`wishlist-${product.id}`}
                          >
                            <Heart size={15} fill={isWatched(product.id) ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => openQuickView(e, product)}
                            aria-label="Quick view"
                            id={`quick-view-${product.id}`}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => handleQuickAdd(e, product)}
                            aria-label="Add to cart"
                            id={`cart-quick-${product.id}`}
                          >
                            <ShoppingBag size={15} />
                          </button>
                        </div>

                        <button
                          className={styles.quickViewBtn}
                          onClick={(e) => openQuickView(e, product)}
                          id={`quick-view-btn-${product.id}`}
                        >
                          <Eye size={13} />
                          Quick View
                        </button>
                      </div>

                      <div className={styles.info}>
                        <span className={styles.category}>{product.category}</span>
                        <h3 className={styles.name}>{product.name}</h3>
                        <div className={styles.priceRow}>
                          {(() => {
                            const s = getSalePrice(product.id, product.price);
                            return s ? (
                              <>
                                <span className={styles.priceSale}>{s.salePriceFormatted}</span>
                                <span className={styles.priceOrig}>{s.originalFormatted}</span>
                              </>
                            ) : (
                              <span className={styles.price}>{product.priceFormatted}</span>
                            );
                          })()}
                          <button
                            className={styles.addBtn}
                            onClick={(e) => handleQuickAdd(e, product)}
                            id={`add-cart-${product.id}`}
                          >
                            Add to Cart
                          </button>
                        </div>
                        <div className={styles.sizeRow}>
                          {product.sizes.slice(0, 5).map((s) => (
                            <span key={s} className={styles.sizeTag}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {!loading && filtered.length === 0 && (
                    <div className={styles.noResults} id="collections-no-results">
                      <p>No products found in this category.</p>
                      <button className={styles.clearFilter} onClick={() => changeFilter('All')}>
                        View All Products
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        <Newsletter />
      </main>
      <Footer />

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}

export default CollectionsPage;
