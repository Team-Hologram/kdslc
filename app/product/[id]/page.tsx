'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Heart, ShoppingBag, Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Truck, RotateCcw, Shield, X, ZoomIn } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SizeGuideModal from '@/components/SizeGuideModal';
import { useCart } from '@/contexts/CartContext';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { useOffers } from '@/contexts/OffersContext';
import { useProducts } from '@/contexts/ProductsContext';
import styles from './product.module.css';
import { use } from 'react';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getProductById, getRelatedProducts, loading } = useProducts();
  const product = getProductById(id);
  const related = product ? getRelatedProducts(id, product.category) : [];
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const selectedImageIndex = product
    ? Math.min(selectedImage, Math.max(product.images.length - 1, 0))
    : 0;
  const selectedSizeValue = product && product.sizes.includes(selectedSize)
    ? selectedSize
    : product?.sizes[1] ?? product?.sizes[0] ?? '';
  const selectedColorValue = product && product.colors.some((color) => color.name === selectedColor)
    ? selectedColor
    : product?.colors[0]?.name ?? '';

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen || !product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLightboxOpen(false); document.body.style.overflow = ''; }
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % product.images.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + product.images.length) % product.images.length);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [lightboxOpen, product]);

  const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); };

  const { addItem } = useCart();
  const { addItem: addToWatchlist, removeItem, isWatched } = useWatchlist();
  const { getSalePrice } = useOffers();
  const watched = product ? isWatched(product.id) : false;

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSizeValue, selectedColorValue);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const toggleWatchlist = () => {
    if (!product) return;
    if (watched) removeItem(product.id);
    else addToWatchlist(product);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className="container">
            <div className={styles.productGrid} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) notFound();

  const accordions = [
    { id: 'details', label: 'Product Details', content: product.details.join(' · ') },
    { id: 'shipping', label: 'Shipping & Delivery', content: 'Free standard delivery on orders over LKR 5,000. Estimated delivery: 3–5 business days. Express delivery available at checkout.' },
    { id: 'returns', label: 'Returns & Exchanges', content: 'Easy 30-day returns. Items must be in original condition with tags attached. Start a return from your account or contact us.' },
  ];

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <Link href="/" className={styles.breadLink}>Home</Link>
            <span className={styles.breadSep}>/</span>
            <Link href="/collections" className={styles.breadLink}>Collections</Link>
            <span className={styles.breadSep}>/</span>
            <span className={styles.breadCurrent}>{product.name}</span>
          </nav>

          <div className={styles.productGrid}>
            {/* Gallery */}
            <div className={styles.gallery}>
              {/* Main image — click to open full-screen lightbox */}
              <div
                className={`${styles.mainImage} ${styles.mainImageClickable}`}
                id="product-main-image"
                onClick={() => openLightbox(selectedImageIndex)}
                title="Click to view full size"
              >
                <Image
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  fill
                  className={styles.mainImg}
                  sizes="50vw"
                  priority
                />
                <div className={styles.imageOverlay} />
                {product.tag && <span className={styles.tag}>{product.tag}</span>}
                {/* Zoom hint overlay */}
                <div className={styles.zoomHint}>
                  <ZoomIn size={18} />
                  <span>View Full Size</span>
                </div>
              </div>
              {product.images.length > 1 && (
                <div className={styles.thumbnails}>
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      className={`${styles.thumb} ${i === selectedImageIndex ? styles.thumbActive : ''}`}
                      onClick={() => setSelectedImage(i)}
                      id={`product-thumb-${i}`}
                    >
                      <Image src={img} alt={`View ${i + 1}`} fill className={styles.thumbImg} sizes="80px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className={styles.info}>
              <div className={styles.infoTop}>
                <span className={styles.category}>{product.category}</span>
                <button
                  className={`${styles.wishBtn} ${watched ? styles.wishBtnActive : ''}`}
                  onClick={toggleWatchlist}
                  id="product-wishlist-btn"
                  aria-label="Toggle watchlist"
                >
                  <Heart size={18} fill={watched ? 'currentColor' : 'none'} />
                  {watched ? 'Saved' : 'Save'}
                </button>
              </div>

              <h1 className={styles.name}>{product.name}</h1>

              <div className={styles.ratingRow}>
                <div className={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.floor(product.rating) ? '#F5A623' : 'none'} stroke={i < Math.floor(product.rating) ? '#F5A623' : '#ccc'} />
                  ))}
                </div>
                <span className={styles.ratingNum}>{product.rating}</span>
                <span className={styles.reviewCount}>({product.reviews} reviews)</span>
              </div>

              {/* Price — shows sale price if active, otherwise original */}
              {(() => {
                const s = getSalePrice(product.id, product.price);
                return s ? (
                  <div className={styles.priceBlock}>
                    <div className={styles.priceSale}>{s.salePriceFormatted}</div>
                    <div className={styles.priceOriginal}>{s.originalFormatted}</div>
                    <div className={styles.salePill}>-{s.percent}% OFF</div>
                  </div>
                ) : (
                  <div className={styles.price}>{product.priceFormatted}</div>
                );
              })()}

              <p className={styles.description}>{product.description}</p>

              {/* Color */}
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>
                  Color: <span className={styles.optionSub}>{selectedColorValue}</span>
                </label>
                <div className={styles.colorSwatches}>
                  {product.colors.map((c) => {
                    const isLight = ['#ffffff', '#fff', '#fafafa', '#f5f5f5', '#fffaf7'].includes(c.hex.toLowerCase());
                    return (
                      <button
                        key={c.name}
                        className={`${styles.colorSwatch} ${selectedColorValue === c.name ? styles.swatchActive : ''} ${isLight ? styles.swatchLight : ''}`}
                        style={{ background: c.hex }}
                        onClick={() => setSelectedColor(c.name)}
                        title={c.name}
                        id={`product-color-${c.name.replace(/\s/g, '-').toLowerCase()}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Size */}
              <div className={styles.optionGroup}>
                <div className={styles.sizeLabelRow}>
                  <label className={styles.optionLabel}>Size</label>
                  <button
                    className={styles.sizeGuide}
                    onClick={() => setShowSizeGuide(true)}
                    id="product-size-guide"
                  >Size Guide</button>
                </div>
                <div className={styles.sizes}>
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      className={`${styles.sizeBtn} ${selectedSizeValue === s ? styles.sizeBtnActive : ''}`}
                      onClick={() => setSelectedSize(s)}
                      id={`product-size-${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Quantity</label>
                <div className={styles.qtyControl}>
                  <button className={styles.qtyBtn} onClick={() => setQuantity(Math.max(1, quantity - 1))} id="product-qty-minus">−</button>
                  <span className={styles.qtyNum}>{quantity}</span>
                  <button className={styles.qtyBtn} onClick={() => setQuantity(quantity + 1)} id="product-qty-plus">+</button>
                </div>
              </div>

              {/* CTA */}
              <div className={styles.actions}>
                <button
                  className={`btn-primary ${styles.addBtn} ${added ? styles.addedBtn : ''}`}
                  onClick={handleAddToCart}
                  id="product-add-cart"
                  disabled={added}
                >
                  <ShoppingBag size={18} />
                  <span>{added ? '✓ Added to Cart!' : 'Add to Cart'}</span>
                </button>
                <Link href="/cart" className="btn-outline" id="product-go-cart">
                  View Cart
                </Link>
              </div>

              {/* Trust icons */}
              <div className={styles.trust}>
                {[
                  { Icon: Truck, label: 'Free delivery over LKR 5,000' },
                  { Icon: RotateCcw, label: '30-day easy returns' },
                  { Icon: Shield, label: 'Secure checkout' },
                ].map(({ Icon, label }) => (
                  <div key={label} className={styles.trustItem}>
                    <Icon size={15} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Accordions */}
              <div className={styles.accordions}>
                {accordions.map((a) => (
                  <div key={a.id} className={styles.accordion} id={`product-accordion-${a.id}`}>
                    <button
                      className={styles.accordionHeader}
                      onClick={() => setOpenAccordion(openAccordion === a.id ? null : a.id)}
                    >
                      <span>{a.label}</span>
                      {openAccordion === a.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <div className={`${styles.accordionBody} ${openAccordion === a.id ? styles.accordionOpen : ''}`}>
                      <p>{a.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className={styles.related}>
              <h2 className={styles.relatedTitle}>
                You May Also <em className={styles.relatedAccent}>Like</em>
              </h2>
              <div className={styles.relatedGrid}>
                {related.map((p) => (
                  <Link href={`/product/${p.id}`} key={p.id} className={styles.relatedCard} id={`related-${p.id}`}>
                    <div className={styles.relatedImg}>
                      <Image src={p.image} alt={p.name} fill className={styles.relatedImage} sizes="25vw" />
                    </div>
                    <span className={styles.relatedCategory}>{p.category}</span>
                    <h3 className={styles.relatedName}>{p.name}</h3>
                    <span className={styles.relatedPrice}>
                      {(() => {
                        const s = getSalePrice(p.id, p.price);
                        return s ? (
                          <><span style={{color:'#1ECFC8',fontWeight:700}}>{s.salePriceFormatted}</span><span style={{fontSize:10,color:'rgba(17,17,17,0.35)',textDecoration:'line-through',marginLeft:4}}>{s.originalFormatted}</span></>
                        ) : p.priceFormatted;
                      })()}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} />}

      {/* ── Full-Screen Lightbox Carousel ── */}
      {lightboxOpen && (
        <div
          className={styles.lightbox}
          id="product-lightbox"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button className={styles.lightboxClose} onClick={() => setLightboxOpen(false)} aria-label="Close lightbox" id="lightbox-close">
            <X size={20} />
          </button>

          {/* Counter */}
          <div className={styles.lightboxCounter}>
            {lightboxIndex + 1} &nbsp;/&nbsp; {product.images.length}
          </div>

          {/* Prev arrow */}
          {product.images.length > 1 && (
            <button
              className={`${styles.lightboxArrow} ${styles.lightboxPrev}`}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + product.images.length) % product.images.length); }}
              aria-label="Previous image"
              id="lightbox-prev"
            >
              <ChevronLeft size={26} />
            </button>
          )}

          {/* Main large image */}
          <div className={styles.lightboxImageWrap} onClick={(e) => e.stopPropagation()}>
            <Image
              key={lightboxIndex}
              src={product.images[lightboxIndex]}
              alt={`${product.name} — view ${lightboxIndex + 1}`}
              fill
              className={styles.lightboxImage}
              sizes="90vw"
              priority
            />
          </div>

          {/* Next arrow */}
          {product.images.length > 1 && (
            <button
              className={`${styles.lightboxArrow} ${styles.lightboxNext}`}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % product.images.length); }}
              aria-label="Next image"
              id="lightbox-next"
            >
              <ChevronRight size={26} />
            </button>
          )}

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className={styles.lightboxThumbs} onClick={(e) => e.stopPropagation()}>
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`${styles.lightboxThumb} ${i === lightboxIndex ? styles.lightboxThumbActive : ''}`}
                  onClick={() => setLightboxIndex(i)}
                  id={`lightbox-thumb-${i}`}
                >
                  <Image src={img} alt={`View ${i + 1}`} fill className={styles.lightboxThumbImg} sizes="80px" />
                </button>
              ))}
            </div>
          )}

          {/* Keyboard hint */}
          <div className={styles.lightboxHint}>← → to navigate &nbsp;·&nbsp; Esc to close</div>
        </div>
      )}
    </>
  );
}
