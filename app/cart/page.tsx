'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, Tag, Check, X, Loader } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useOffers } from '@/contexts/OffersContext';
import styles from './cart.module.css';

interface PromoResult {
  valid: boolean;
  code?: string;
  label?: string;
  discountLabel?: string;
  discountType?: string;
  discountAmount?: number;
  freeShipping?: boolean;
  message: string;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, itemCount } = useCart();
  const { getSalePrice, settings } = useOffers();
  const { freeShippingThreshold, shippingFee } = settings;

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Compute effective subtotal (uses sale prices if product is on sale)
  const effectiveSubtotal = items.reduce((sum, item) => {
    const s = getSalePrice(item.product.id, item.product.price);
    const unitPrice = s ? s.salePrice : item.product.price;
    return sum + unitPrice * item.quantity;
  }, 0);

  // Discount from promo code
  const promoDiscount = promo?.valid ? (promo.discountAmount ?? 0) : 0;
  const promoFreeShipping = promo?.valid && promo.freeShipping;
  const discountedSubtotal = effectiveSubtotal - promoDiscount;

  const shipping = promoFreeShipping
    ? 0
    : discountedSubtotal >= freeShippingThreshold ? 0 : shippingFee;
  const total = discountedSubtotal + shipping;
  const amountNeeded = freeShippingThreshold - discountedSubtotal;

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setValidatingPromo(true);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim().toUpperCase(), subtotal: effectiveSubtotal }),
      });
      const data: PromoResult = await res.json();
      setPromo(data);
      if (data.valid) {
        // Persist applied promo to sessionStorage for checkout page
        sessionStorage.setItem('applied_promo', JSON.stringify(data));
      }
    } catch {
      setPromo({ valid: false, message: 'Network error. Please try again.' });
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromo(null);
    setPromoInput('');
    sessionStorage.removeItem('applied_promo');
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <Link href="/collections" className={styles.backLink} id="cart-back">
              <ArrowLeft size={16} />
              <span>Continue Shopping</span>
            </Link>
            <h1 className={styles.title}>
              Your <em className={styles.titleAccent}>Cart</em>
            </h1>
            <span className={styles.count}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          </div>

          {items.length === 0 ? (
            <div className={styles.empty} id="cart-empty">
              <div className={styles.emptyIcon}><ShoppingBag size={48} strokeWidth={1} /></div>
              <h2 className={styles.emptyTitle}>Your cart is empty</h2>
              <p className={styles.emptyText}>Discover our luxury collection and add pieces you love.</p>
              <Link href="/collections" className="btn-primary" id="cart-shop-now">
                <span>Shop Collections</span>
              </Link>
            </div>
          ) : (
            <div className={styles.layout}>
              {/* Items */}
              <div className={styles.items}>
                {items.map((item) => {
                  const s = getSalePrice(item.product.id, item.product.price);
                  const unitPrice = s ? s.salePrice : item.product.price;
                  return (
                    <div key={`${item.product.id}-${item.size}`} className={styles.cartItem} id={`cart-item-${item.product.id}`}>
                      <div className={styles.itemImage}>
                        <Image src={item.product.image} alt={item.product.name} fill className={styles.itemImg} sizes="100px" />
                      </div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemTop}>
                          <div>
                            <span className={styles.itemCategory}>{item.product.category}</span>
                            <Link href={`/product/${item.product.id}`} className={styles.itemName}>
                              {item.product.name}
                            </Link>
                            <div className={styles.itemMeta}>
                              <span>Size: <strong>{item.size}</strong></span>
                              {item.color && <span>Color: <strong>{item.color}</strong></span>}
                            </div>
                            {/* Sale badge */}
                            {s && (
                              <div className={styles.itemSaleBadge}>
                                -{s.percent}% OFF · {s.salePriceFormatted} each
                                <span className={styles.itemSaleOrig}>{s.originalFormatted}</span>
                              </div>
                            )}
                          </div>
                          <button
                            className={styles.removeBtn}
                            onClick={() => removeItem(item.product.id, item.size)}
                            id={`cart-remove-${item.product.id}`}
                            aria-label="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className={styles.itemBottom}>
                          <div className={styles.qtyControl}>
                            <button className={styles.qtyBtn} onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)} id={`cart-qty-minus-${item.product.id}`}>
                              <Minus size={13} />
                            </button>
                            <span className={styles.qtyNum}>{item.quantity}</span>
                            <button className={styles.qtyBtn} onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)} id={`cart-qty-plus-${item.product.id}`}>
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className={styles.itemPrice}>
                            LKR {(unitPrice * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className={styles.summary} id="cart-summary">
                <h2 className={styles.summaryTitle}>Order Summary</h2>

                {/* Promo Code Input */}
                <div className={styles.promoSection}>
                  <p className={styles.promoLabel}><Tag size={13} /> Promo Code</p>
                  {promo?.valid ? (
                    <div className={styles.promoApplied}>
                      <div className={styles.promoAppliedInfo}>
                        <Check size={14} className={styles.promoCheck} />
                        <div>
                          <div className={styles.promoCode}>{promo.code}</div>
                          <div className={styles.promoSaving}>{promo.discountLabel}</div>
                        </div>
                      </div>
                      <button className={styles.promoRemoveBtn} onClick={handleRemovePromo} aria-label="Remove promo">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={styles.promoRow}>
                        <input
                          id="cart-promo-input"
                          className={styles.promoInput}
                          placeholder="Enter promo code"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                        />
                        <button
                          className={styles.promoBtn}
                          onClick={handleApplyPromo}
                          disabled={validatingPromo || !promoInput.trim()}
                          id="cart-promo-apply"
                        >
                          {validatingPromo ? <Loader size={13} className={styles.spin} /> : 'Apply'}
                        </button>
                      </div>
                      {promo && !promo.valid && (
                        <p className={styles.promoError}>{promo.message}</p>
                      )}
                    </>
                  )}
                </div>

                <div className={styles.summaryLines}>
                  <div className={styles.summaryLine}>
                    <span>Subtotal</span>
                    <span>LKR {effectiveSubtotal.toLocaleString()}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className={`${styles.summaryLine} ${styles.discountLine}`}>
                      <span>Promo ({promo?.code})</span>
                      <span>-LKR {promoDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className={styles.summaryLine}>
                    <span>Shipping</span>
                    <span className={shipping === 0 ? styles.free : ''}>
                      {shipping === 0 ? 'Free' : `LKR ${shipping.toLocaleString()}`}
                    </span>
                  </div>
                  {shipping > 0 && !promoFreeShipping && (
                    <p className={styles.shippingNote}>
                      Add LKR {Math.max(0, amountNeeded).toLocaleString()} more for free shipping
                    </p>
                  )}
                  {promoFreeShipping && (
                    <p className={styles.shippingNote} style={{ color: '#1ECFC8' }}>
                      ✓ Free shipping applied
                    </p>
                  )}
                  <div className={`${styles.summaryLine} ${styles.totalLine}`}>
                    <span>Total</span>
                    <span>LKR {total.toLocaleString()}</span>
                  </div>
                </div>

                <Link href="/checkout" className="btn-primary" style={{ justifyContent: 'center', width: '100%' }} id="cart-checkout">
                  <span>Proceed to Checkout</span>
                </Link>

                <div className={styles.paymentIcons}>
                  <span className={styles.payLabel}>Secure payments via</span>
                  <div className={styles.payBadges}>
                    {['Visa', 'Mastercard', 'PayPal'].map((p) => (
                      <span key={p} className={styles.payBadge}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
