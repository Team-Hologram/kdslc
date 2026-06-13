'use client';
import { useEffect, useState } from 'react';
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShoppingBag, ArrowLeft, Check, Star, Package, Info } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Product } from '@/lib/products';
import { useCart } from '@/contexts/CartContext';
import { useOffers } from '@/contexts/OffersContext';
import { useProducts } from '@/contexts/ProductsContext';
import styles from './bundle.module.css';

interface BundleDeal {
  id: string;
  title: string;
  description: string;
  saving_label: string;
  badge: string;
  product_ids: string[];
  color: string;
}

/* Per-product selection: { productId → { size, color } } */
type Selection = Record<string, { size: string; color: string }>;

export default function BundlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [bundle, setBundle] = useState<BundleDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedAll, setAddedAll] = useState(false);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [selection, setSelection] = useState<Selection>({});   // per-product size + color
  const [selectionError, setSelectionError] = useState<Record<string, string>>({});

  const { addItem } = useCart();
  const { getSalePrice } = useOffers();
  const { products: allProducts, loading: productsLoading } = useProducts();

  useEffect(() => {
    if (productsLoading) return;
    fetch('/api/offers')
      .then((r) => r.json())
      .then((data) => {
        const found = data.bundles?.find((b: BundleDeal) => b.id === id);
        setBundle(found ?? null);
        // Pre-select defaults for each product
        if (found) {
          const bundleProds = allProducts.filter((p) => found.product_ids.includes(p.id));
          const defaults: Selection = {};
          bundleProds.forEach((p) => {
            defaults[p.id] = {
              size: p.sizes[1] ?? p.sizes[0] ?? '',
              color: p.colors[0]?.name ?? '',
            };
          });
          setSelection(defaults);
        }
      })
      .catch(() => setBundle(null))
      .finally(() => setLoading(false));
  }, [id, allProducts, productsLoading]);

  if (loading || productsLoading) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.skeleton}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonGrid} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!bundle) notFound();

  const bundleProducts = allProducts.filter((p) => bundle.product_ids.includes(p.id));
  const accentColor = bundle.color === 'teal' ? '#1ECFC8' : bundle.color === 'purple' ? '#8B3DFF' : '#F5A623';

  /* ── Price calculations ── */
  // Total of individual items at their current (sale or regular) price
  const bundleTotal = bundleProducts.reduce((sum, p) => {
    const s = getSalePrice(p.id, p.price);
    return sum + (s ? s.salePrice : p.price);
  }, 0);
  // Original total without any sale discounts
  const originalTotal = bundleProducts.reduce((sum, p) => sum + p.price, 0);
  // Amount saved (sale discount + any conceptual bundle saving)
  const savedAmount = originalTotal - bundleTotal;

  /* ── Selection helpers ── */
  const setSize = (productId: string, size: string) => {
    setSelection((prev) => ({ ...prev, [productId]: { ...prev[productId], size } }));
    setSelectionError((prev) => ({ ...prev, [productId]: '' }));
  };

  const setColor = (productId: string, color: string) => {
    setSelection((prev) => ({ ...prev, [productId]: { ...prev[productId], color } }));
  };

  const validateAll = (): boolean => {
    const errors: Record<string, string> = {};
    bundleProducts.forEach((p) => {
      if (!selection[p.id]?.size) errors[p.id] = 'Please select a size';
    });
    setSelectionError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAll = () => {
    if (!validateAll()) return;
    bundleProducts.forEach((p) => {
      const sel = selection[p.id];
      addItem(p, sel?.size ?? p.sizes[0], sel?.color ?? p.colors[0]?.name ?? '');
    });
    setAddedAll(true);
    setAddedIds(bundleProducts.map((p) => p.id));
    setTimeout(() => setAddedAll(false), 3000);
  };

  const handleAddOne = (product: Product) => {
    const sel = selection[product.id];
    if (!sel?.size) {
      setSelectionError((prev) => ({ ...prev, [product.id]: 'Please select a size' }));
      return;
    }
    addItem(product, sel.size, sel.color ?? product.colors[0]?.name ?? '');
    setAddedIds((prev) => [...prev, product.id]);
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((pid) => pid !== product.id));
    }, 2500);
  };

  const fmtLKR = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;

  return (
    <>
      <Navbar />
      <main className={styles.main} id="bundle-page">
        {/* ── Hero Banner ── */}
        <div className={styles.hero} style={{ '--accent': accentColor } as React.CSSProperties}>
          <div className={styles.heroBg} />
          <div className="container">
            <Link href="/offers" className={styles.backLink} id="bundle-back">
              <ArrowLeft size={16} />
              Back to Offers
            </Link>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge} style={{ background: accentColor }}>
                <Package size={14} /> Bundle Deal
              </div>
              {bundle.badge && <span className={styles.limitedBadge}>{bundle.badge}</span>}
              <h1 className={styles.heroTitle}>{bundle.title}</h1>
              <p className={styles.heroDesc}>{bundle.description}</p>

              {/* ── Bundle Price Summary ── */}
              <div className={styles.priceSummaryCard}>
                <div className={styles.priceSummaryRow}>
                  <div>
                    <div className={styles.priceSummaryLabel}>Bundle Total</div>
                    <div className={styles.priceSummaryValue}>{fmtLKR(bundleTotal)}</div>
                  </div>
                  {savedAmount > 0 && (
                    <div className={styles.priceSummarySaving}>
                      <Star size={13} fill={accentColor} stroke={accentColor} />
                      {bundle.saving_label || `You save ${fmtLKR(savedAmount)}`}
                    </div>
                  )}
                </div>
                {savedAmount > 0 && (
                  <div className={styles.priceSummaryOrig}>
                    Regular total: <s>{fmtLKR(originalTotal)}</s>
                  </div>
                )}
                <div className={styles.priceSummaryNote}>
                  <Info size={11} />
                  Includes {bundleProducts.length} items. Select sizes below, then add all to cart.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          {/* ── Bundle Products ── */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                What&apos;s in the Bundle ({bundleProducts.length} items)
              </h2>
              <button
                className={styles.addAllBtn}
                onClick={handleAddAll}
                id="bundle-add-all"
                style={{ background: addedAll ? '#1ECFC8' : accentColor }}
              >
                {addedAll ? (
                  <><Check size={15} /> All Added to Cart!</>
                ) : (
                  <><ShoppingBag size={15} /> Add All to Cart</>
                )}
              </button>
            </div>

            <div className={styles.grid}>
              {bundleProducts.map((product) => {
                const s = getSalePrice(product.id, product.price);
                const isAdded = addedIds.includes(product.id);
                const sel = selection[product.id] ?? { size: '', color: '' };
                const isLight = (hex: string) =>
                  ['#ffffff', '#fff', '#fafafa', '#f5f5f5', '#fffaf7'].includes(hex.toLowerCase());

                return (
                  <div key={product.id} className={styles.card} id={`bundle-product-${product.id}`}>
                    {/* Product image */}
                    <Link href={`/product/${product.id}`} className={styles.imgWrap}>
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className={styles.img}
                      />
                      {product.tag && <span className={styles.tag}>{product.tag}</span>}
                      {s && <span className={styles.discBadge} style={{ background: accentColor }}>-{s.percent}%</span>}
                    </Link>

                    <div className={styles.info}>
                      <span className={styles.category}>{product.category}</span>
                      <Link href={`/product/${product.id}`} className={styles.name}>{product.name}</Link>
                      <p className={styles.desc}>{product.description?.slice(0, 90)}…</p>

                      {/* ── Price ── */}
                      <div className={styles.priceRow}>
                        {s ? (
                          <>
                            <span className={styles.priceSale}>{s.salePriceFormatted}</span>
                            <span className={styles.priceOrig}>{s.originalFormatted}</span>
                          </>
                        ) : (
                          <span className={styles.price}>{product.priceFormatted}</span>
                        )}
                      </div>

                      {/* ── Color Selection ── */}
                      {product.colors.length > 0 && (
                        <div className={styles.optionGroup}>
                          <label className={styles.optionLabel}>
                            Color: <span className={styles.optionVal}>{sel.color || product.colors[0]?.name}</span>
                          </label>
                          <div className={styles.colorSwatches}>
                            {product.colors.map((c) => (
                              <button
                                key={c.name}
                                className={`${styles.swatch} ${sel.color === c.name ? styles.swatchActive : ''} ${isLight(c.hex) ? styles.swatchLight : ''}`}
                                style={{ background: c.hex }}
                                onClick={() => setColor(product.id, c.name)}
                                title={c.name}
                                id={`bundle-color-${product.id}-${c.name}`}
                                aria-label={c.name}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Size Selection ── */}
                      <div className={styles.optionGroup}>
                        <label className={styles.optionLabel}>
                          Size: <span className={styles.optionVal}>{sel.size || '—'}</span>
                        </label>
                        <div className={styles.sizeGrid}>
                          {product.sizes.map((sz) => (
                            <button
                              key={sz}
                              className={`${styles.sizeBtn} ${sel.size === sz ? styles.sizeBtnActive : ''}`}
                              onClick={() => setSize(product.id, sz)}
                              style={sel.size === sz ? { borderColor: accentColor, color: accentColor } : {}}
                              id={`bundle-size-${product.id}-${sz}`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                        {selectionError[product.id] && (
                          <p className={styles.selectionError}>{selectionError[product.id]}</p>
                        )}
                      </div>

                      {/* ── Actions ── */}
                      <div className={styles.cardActions}>
                        <button
                          className={`${styles.addBtn} ${isAdded ? styles.addedBtn : ''}`}
                          onClick={() => handleAddOne(product)}
                          id={`bundle-add-${product.id}`}
                          style={isAdded ? {} : { borderColor: accentColor, color: accentColor }}
                        >
                          {isAdded
                            ? <><Check size={13} /> Added!</>
                            : <><ShoppingBag size={13} /> Add to Cart</>}
                        </button>
                        <Link href={`/product/${product.id}`} className={styles.viewBtn} id={`bundle-view-${product.id}`}>
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CTA Bar ── */}
          <div className={styles.ctaBar}>
            <div>
              <h3 className={styles.ctaTitle}>Get the complete bundle</h3>
              <p className={styles.ctaSub}>
                {fmtLKR(bundleTotal)} for {bundleProducts.length} items
                {savedAmount > 0 && ` · ${bundle.saving_label || `Save ${fmtLKR(savedAmount)}`}`}
              </p>
            </div>
            <button
              className={styles.ctaBtn}
              onClick={handleAddAll}
              id="bundle-cta-add-all"
              style={{ background: addedAll ? '#1ECFC8' : accentColor }}
            >
              {addedAll
                ? <><Check size={16} /> All Added!</>
                : <><ShoppingBag size={16} /> Add All Items</>}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
