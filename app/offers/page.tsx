'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tag, Zap, Gift, Truck, Copy, Check, ArrowRight, Star, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useOffers } from '@/contexts/OffersContext';
import { useProducts } from '@/contexts/ProductsContext';
import type { Product } from '@/lib/products';
import styles from './offers.module.css';

const titleCase = (value: string | null | undefined) => {
  const color = value || 'teal';
  return color.charAt(0).toUpperCase() + color.slice(1);
};

const getStyle = (key: string, fallback: string) => styles[key] ?? fallback;

const safeScrollBy = (element: HTMLElement, left: number) => {
  element.scrollLeft += left;
};

/* ── Countdown hook ── */
function useCountdown(endsAt: string | undefined) {
  const calc = useCallback(() => {
    if (!endsAt) return { hrs: '00', min: '00', sec: '00', expired: true };
    const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
    if (diff === 0) return { hrs: '00', min: '00', sec: '00', expired: true };
    return {
      hrs: String(Math.floor(diff / 3_600_000)).padStart(2, '0'),
      min: String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, '0'),
      sec: String(Math.floor((diff % 60_000) / 1_000)).padStart(2, '0'),
      expired: false,
    };
  }, [endsAt]);

  const [time, setTime] = useState(calc);

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [endsAt, calc]);

  return time;
}

export default function OffersPage() {
  const { addItem } = useCart();
  const {
    flashSale,
    promoCodes,
    bundles,
    saleItems,
    settings,
    loading,
  } = useOffers();   // ← reads from global OffersContext (fetched once on app load)
  const { products } = useProducts();

  const [copiedCode, setCopiedCode] = useState('');
  const [addedId, setAddedId] = useState('');

  const visibleSaleItems = saleItems
    .map((item) => ({
      ...item,
      resolvedProduct: products.find((p) => p.id === item.product_id) ?? item.products,
    }))
    .filter((item): item is typeof item & { resolvedProduct: Product } => Boolean(item.resolvedProduct));

  /* Live countdown driven by DB's ends_at */
  const time = useCountdown(flashSale?.ends_at);

  /* Copy promo code */
  const copyCode = (code: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  /* Add to cart from sale grid */
  const handleAddToCart = (item: typeof saleItems[0]) => {
    const product = products.find((p) => p.id === item.product_id) ?? item.products;
    if (!product) return;
    addItem(product, product.sizes[1] ?? product.sizes[0], product.colors[0]?.name ?? '');
    setAddedId(item.product_id);
    setTimeout(() => setAddedId(''), 2000);
  };

  /* Bundle images from Supabase products */
  const getBundleProducts = (ids: string[]) =>
    products.filter((p) => (ids ?? []).includes(p.id));

  const bundlesRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const promoCodesRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftPromo, setCanScrollLeftPromo] = useState(false);
  const [canScrollRightPromo, setCanScrollRightPromo] = useState(true);

  const checkScroll = useCallback(() => {
    if (!bundlesRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = bundlesRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
  }, []);

  const checkScrollPromo = useCallback(() => {
    if (!promoCodesRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = promoCodesRef.current;
    setCanScrollLeftPromo(scrollLeft > 0);
    setCanScrollRightPromo(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
  }, []);

  useEffect(() => {
    checkScroll();
    checkScrollPromo();
    const handleResize = () => {
      checkScroll();
      checkScrollPromo();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScroll, checkScrollPromo, bundles, promoCodes]);

  const scrollBundles = (dir: 'left' | 'right') => {
    if (!bundlesRef.current) return;
    const scrollAmount = window.innerWidth > 768 ? 500 : 300;
    safeScrollBy(bundlesRef.current, dir === 'left' ? -scrollAmount : scrollAmount);
  };

  const scrollPromos = (dir: 'left' | 'right') => {
    if (!promoCodesRef.current) return;
    const scrollAmount = window.innerWidth > 768 ? 400 : 300;
    safeScrollBy(promoCodesRef.current, dir === 'left' ? -scrollAmount : scrollAmount);
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
              <div className={styles.heroInner}>
                <div className={styles.heroBadge}><Tag size={14} /><span>Loading Offers…</span></div>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonText} />
              </div>
            </div>
          </div>
          <div className="container"><div className={styles.skeletonGrid} /></div>
        </main>
        <Footer />
      </>
    );
  }

  const hasAnyOffer = promoCodes.length > 0 || bundles.length > 0 || visibleSaleItems.length > 0;
  const { freeShippingThreshold } = settings;

  /* Free-shipping badge:
     Show ONLY when flash_sale.free_shipping_enabled = true in the DB.
     The badge_text is still used for the label, falling back to freeShippingBadgeText setting. */
  const showFreeShippingBadge =
    flashSale?.free_shipping_enabled &&
    (flashSale.badge_text || settings.freeShippingBadgeText);
  const freeShippingBadgeLabel =
    flashSale?.badge_text || settings.freeShippingBadgeText || 'Free shipping today';

  return (
    <>
      <Navbar />
      <main className={styles.main} id="offers-main">

        {/* ── Hero Banner ── */}
        <section className={styles.hero} id="offers-hero">
          <div className={styles.heroGlow} />
          <div className={styles.heroGlow2} />
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div className={styles.heroInner}>
              <div className={styles.heroBadge}>
                <Tag size={14} />
                <span>{flashSale ? 'Limited Time Deals' : 'Exclusive Deals'}</span>
              </div>
              <h1 className={styles.heroTitle}>
                Exclusive<br />
                <em className={styles.heroAccent}>Offers</em> &amp; Deals
              </h1>
              <p className={styles.heroSub}>
                Curated discounts, bundle deals, and promo codes — updated regularly.
              </p>
              <div className={styles.heroActions}>
                {saleItems.length > 0 && (
                  <Link href="#sale-products" className="btn-primary" id="offers-shop-now">
                    <span>Shop Sale Items</span>
                  </Link>
                )}
                {promoCodes.length > 0 && (
                  <Link href="#promo-codes" className={styles.heroSecondary}>
                    Get Promo Codes →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="container">

          {/* ── Flash Sale Countdown — only shown when DB has active flash_sale with future ends_at ── */}
          {flashSale && !time.expired && (
            <div className={styles.urgencyStrip} id="offers-urgency">
              <Zap size={16} className={styles.urgencyIcon} />
              <span className={styles.urgencyText}>{flashSale.title}</span>
              <div className={styles.urgencyCounts}>
                {[
                  { label: 'hrs', val: time.hrs },
                  { label: 'min', val: time.min },
                  { label: 'sec', val: time.sec },
                ].map((t) => (
                  <div key={t.label} className={styles.urgencyUnit}>
                    <span className={styles.urgencyNum}>{t.val}</span>
                    <span className={styles.urgencyLabel}>{t.label}</span>
                  </div>
                ))}
              </div>
              {/* Free-shipping badge: only shows when free_shipping_enabled=true in flash_sales table */}
              {showFreeShippingBadge && (
                <span className={styles.urgencyBadge}>
                  <Truck size={13} /> {freeShippingBadgeLabel}
                </span>
              )}
            </div>
          )}

          {/* ── Empty state ── */}
          {!hasAnyOffer && (
            <div className={styles.emptyOffers} id="offers-empty">
              <div className={styles.emptyIcon}><AlertCircle size={32} /></div>
              <h2 className={styles.emptyTitle}>No Active Offers Right Now</h2>
              <p className={styles.emptyText}>Check back soon — new deals are added regularly.</p>
              <Link href="/collections" className="btn-primary">
                <span>Browse All Products</span>
              </Link>
            </div>
          )}

          {/* ── Promo Codes — only if promoCodes.length > 0 ── */}
          {promoCodes.length > 0 && (
            <section className={styles.section} id="promo-codes">
              <div className={styles.sectionHead}>
                <div>
                  <h2 className={styles.sectionTitle}><Gift size={18} /> Promo Codes</h2>
                  <p className={styles.sectionSub}>Copy a code and paste it at checkout</p>
                </div>
                <div className={styles.carouselControls}>
                  {canScrollLeftPromo && (
                    <button className={styles.carouselArrow} onClick={() => scrollPromos('left')} aria-label="Scroll left">
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  {canScrollRightPromo && (
                    <button className={styles.carouselArrow} onClick={() => scrollPromos('right')} aria-label="Scroll right">
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.couponGrid} ref={promoCodesRef} onScroll={checkScrollPromo}>
                {promoCodes.map((c) => (
                  <div
                    key={c.id}
                    className={`${styles.couponCard} ${getStyle(`coupon${titleCase(c.color)}`, styles.couponTeal)}`}
                  >
                    <div className={styles.couponLabel}>{c.label}</div>
                    <div className={styles.couponDesc}>{c.description}</div>
                    {c.min_order > 0 && (
                      <div className={styles.couponMin}>
                        Min. order: LKR {(c.min_order ?? 0).toLocaleString()}
                      </div>
                    )}
                    <div className={styles.couponRow}>
                      <div className={styles.couponCode}>{c.code}</div>
                      <button
                        className={styles.copyBtn}
                        onClick={() => copyCode(c.code)}
                        id={`coupon-copy-${c.code}`}
                      >
                        {copiedCode === c.code
                          ? <><Check size={13} /> Copied!</>
                          : <><Copy size={13} /> Copy</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Bundle Deals — only if bundles.length > 0 ── */}
          {bundles.length > 0 && (
            <section className={styles.section} id="offers-bundles">
              <div className={styles.sectionHead}>
                <div>
                  <h2 className={styles.sectionTitle}><Star size={18} /> Bundle Deals</h2>
                  <p className={styles.sectionSub}>More value when you shop together</p>
                </div>
                <div className={styles.carouselControls}>
                  {canScrollLeft && (
                    <button className={styles.carouselArrow} onClick={() => scrollBundles('left')} aria-label="Scroll left">
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  {canScrollRight && (
                    <button className={styles.carouselArrow} onClick={() => scrollBundles('right')} aria-label="Scroll right">
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.bundleGrid} ref={bundlesRef} onScroll={checkScroll}>
                {bundles.map((b) => {
                  const bundleProducts = getBundleProducts(b.product_ids ?? []);
                  return (
                    <div
                      key={b.id}
                      className={`${styles.bundleCard} ${getStyle(`bundle${titleCase(b.color)}`, styles.bundleTeal)}`}
                    >
                      {b.badge && <div className={styles.bundleBadge}>{b.badge}</div>}
                      <div className={styles.bundleImages}>
                        {bundleProducts.slice(0, 3).map((p) => (
                          <div key={p.id} className={styles.bundleImgWrap}>
                            <Image src={p.image} alt={p.name} fill sizes="100px" className={styles.bundleImg} />
                          </div>
                        ))}
                      </div>
                      <div className={styles.bundleInfo}>
                        <h3 className={styles.bundleTitle}>{b.title}</h3>
                        <p className={styles.bundleDesc}>{b.description}</p>
                        {b.saving_label && <div className={styles.bundleSaving}>{b.saving_label}</div>}
                        <Link href={`/bundle/${b.id}`} className={styles.bundleBtn} id={`bundle-${b.id}`}>
                          Shop Bundle <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Sale Products — only if saleItems.length > 0 ── */}
          {visibleSaleItems.length > 0 && (
            <section className={styles.section} id="sale-products">
              <div className={styles.sectionHead}>
                <div>
                  <h2 className={styles.sectionTitle}><Tag size={18} /> On Sale Now</h2>
                  <p className={styles.sectionSub}>{visibleSaleItems.length} item{visibleSaleItems.length !== 1 ? 's' : ''} marked down</p>
                </div>
              </div>
              <div className={styles.saleGrid}>
                {visibleSaleItems.map((item) => {
                  const p = item.resolvedProduct;
                  const salePrice = Math.round(p.price * (1 - item.sale_percent / 100));
                  return (
                    <div key={item.id} className={styles.saleCard} id={`sale-${item.product_id}`}>
                      <Link href={`/product/${item.product_id}`} className={styles.saleImgWrap}>
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className={styles.saleImg}
                        />
                        <div className={styles.saleBadge}>-{item.sale_percent}%</div>
                      </Link>
                      <div className={styles.saleInfo}>
                        <span className={styles.saleCategory}>{p.category}</span>
                        <Link href={`/product/${item.product_id}`} className={styles.saleName}>{p.name}</Link>
                        <div className={styles.salePriceRow}>
                          <span className={styles.salePrice}>LKR {salePrice.toLocaleString()}</span>
                          <span className={styles.saleOriginal}>LKR {p.price.toLocaleString()}</span>
                        </div>
                        <button
                          className={`${styles.saleAddBtn} ${addedId === item.product_id ? styles.saleAdded : ''}`}
                          onClick={() => handleAddToCart(item)}
                          id={`sale-add-${item.product_id}`}
                        >
                          {addedId === item.product_id
                            ? <><Check size={13} /> Added!</>
                            : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Shipping Promo Banner — threshold from DB settings ── */}
          <section className={styles.shippingBanner} id="offers-shipping">
            <div className={styles.shippingContent}>
              <Truck size={28} className={styles.shippingIcon} />
              <div>
                <h3 className={styles.shippingTitle}>
                  Free Shipping on Orders Above LKR {freeShippingThreshold.toLocaleString()}
                </h3>
                <p className={styles.shippingText}>
                  Standard delivery across Sri Lanka. No code needed.
                </p>
              </div>
            </div>
            <Link href="/collections" className="btn-primary" id="offers-shop-free-ship">
              <span>Shop Now</span>
            </Link>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
