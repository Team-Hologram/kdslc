'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, CreditCard, Truck, Package, MapPin, ChevronDown, Tag, Check, X, Loader, Wallet, Landmark } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import CheckoutAuthModal from '@/components/CheckoutAuthModal';
import { useOffers } from '@/contexts/OffersContext';
import styles from './checkout.module.css';

const steps = ['Shipping', 'Payment', 'Confirm'];
type FormErrors = Record<string, string>;
type PaymentMethod = 'card' | 'paypal' | 'bank_transfer';

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string; summary: string; icon: any; disabled?: boolean; badge?: string }> = [
  { id: 'card', label: 'Debit or Credit Card', summary: 'PayHere sandbox checkout', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', summary: 'Coming soon', icon: Wallet, disabled: true, badge: 'Coming soon' },
  { id: 'bank_transfer', label: 'Bank Transfer', summary: 'Pay by direct deposit', icon: Landmark },
];

declare global {
  interface Window {
    payhere?: {
      startPayment: (payment: Record<string, unknown>) => void;
      onCompleted?: (orderId: string) => void;
      onDismissed?: () => void;
      onError?: (error: string) => void;
    };
    paypal?: {
      Buttons: (options: Record<string, unknown>) => { render: (selector: string) => Promise<void> };
    };
  }
}

function paymentLabel(method: PaymentMethod) {
  return PAYMENT_METHODS.find((option) => option.id === method)?.label ?? 'Payment';
}

interface SavedAddress {
  firstName?: string; lastName?: string;
  email?: string; phone?: string;
  address?: string; city?: string; state?: string; zip?: string;
}

/* ── Validators ── */
function validateShipping(form: Record<string, string>): FormErrors {
  const e: FormErrors = {};
  if (!form.firstName.trim()) e.firstName = 'Required';
  if (!form.lastName.trim()) e.lastName = 'Required';
  if (!form.email.trim()) e.email = 'Required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
  if (!form.phone.trim()) e.phone = 'Required';
  else if (form.phone.replace(/\D/g, '').length < 9) e.phone = 'Min. 9 digits';
  if (!form.address.trim()) e.address = 'Required';
  if (!form.city.trim()) e.city = 'Required';
  if (!form.state.trim()) e.state = 'Required';
  if (!form.zip.trim()) e.zip = 'Required';
  return e;
}

function validatePayment(form: Record<string, string>, paymentMethod: PaymentMethod): FormErrors {
  const e: FormErrors = {};
  return e;
}

function loadScript(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${id}`));
    document.body.appendChild(script);
  });
}

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  address: '', city: '', state: '', zip: '',
  cardNumber: '', cardExpiry: '', cardCvc: '', cardName: '',
};

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, clearCart } = useCart();
  const router = useRouter();
  const { getSalePrice, settings } = useOffers();
  const { freeShippingThreshold, shippingFee } = settings;

  // Effective subtotal using sale prices
  const effectiveSubtotal = items.reduce((sum, item) => {
    const s = getSalePrice(item.product.id, item.product.price);
    return sum + (s ? s.salePrice : item.product.price) * item.quantity;
  }, 0);

  // Promo code (persisted from cart via sessionStorage)
  interface PromoResult { valid: boolean; code?: string; label?: string; discountLabel?: string; discountType?: string; discountAmount?: number; freeShipping?: boolean; message: string; }
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Load promo applied in cart
  useEffect(() => {
    const saved = sessionStorage.getItem('applied_promo');
    if (saved) { try { setPromo(JSON.parse(saved)); } catch { /* ignore */ } }
  }, []);

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
      if (data.valid) sessionStorage.setItem('applied_promo', JSON.stringify(data));
    } catch { setPromo({ valid: false, message: 'Network error.' }); }
    finally { setValidatingPromo(false); }
  };

  const handleRemovePromo = () => { setPromo(null); setPromoInput(''); sessionStorage.removeItem('applied_promo'); };

  const promoDiscount = promo?.valid ? (promo.discountAmount ?? 0) : 0;
  const promoFreeShipping = promo?.valid && promo.freeShipping;
  const discountedSubtotal = effectiveSubtotal - promoDiscount;
  const shipping = promoFreeShipping ? 0 : (discountedSubtotal >= freeShippingThreshold ? 0 : shippingFee);
  const total = discountedSubtotal + shipping;

  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [pendingOrderId, setPendingOrderId] = useState('');
  const pendingOrderIdRef = useRef('');
  const pendingOrderMethodRef = useRef<PaymentMethod | ''>('');
  const paypalRenderedRef = useRef('');

  // Saved address feature
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [usingSaved, setUsingSaved] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(true);

  // Load saved address when user is available
  useEffect(() => {
    if (!user) return;
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ profile }) => {
        if (profile?.default_address) {
          setSavedAddress(profile.default_address);
          // Pre-fill form with saved address
          const a = profile.default_address;
          setForm((f) => ({
            ...f,
            firstName: a.firstName ?? '',
            lastName: a.lastName ?? '',
            email: a.email ?? user.email ?? '',
            phone: a.phone ?? '',
            address: a.address ?? '',
            city: a.city ?? '',
            state: a.state ?? '',
            zip: a.zip ?? '',
          }));
          setUsingSaved(true);
          setShowAddressForm(false);
        } else {
          // No saved address — pre-fill email at least
          setForm((f) => ({ ...f, email: user.email ?? '' }));
        }
      })
      .catch(() => { /* ignore */ });
  }, [user]);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((prev) => ({ ...prev, [k]: '' }));
  };

  const applySavedAddress = () => {
    if (!savedAddress) return;
    const a = savedAddress;
    setForm((f) => ({
      ...f,
      firstName: a.firstName ?? '',
      lastName: a.lastName ?? '',
      email: a.email ?? user?.email ?? '',
      phone: a.phone ?? '',
      address: a.address ?? '',
      city: a.city ?? '',
      state: a.state ?? '',
      zip: a.zip ?? '',
    }));
    setUsingSaved(true);
    setShowAddressForm(false);
    setFieldErrors({});
  };

  const useDifferentAddress = () => {
    setForm(EMPTY_FORM);
    setUsingSaved(false);
    setShowAddressForm(true);
    setSaveAsDefault(true);
  };

  const goToPayment = () => {
    const errors = validateShipping(form);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setStep(1);
  };

  const goToConfirm = () => {
    const errors = validatePayment(form, paymentMethod);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setStep(2);
  };

  const buildOrderPayload = (method: PaymentMethod) => {
    const shippingAddress = {
      firstName: form.firstName, lastName: form.lastName,
      email: form.email, phone: form.phone,
      address: form.address, city: form.city,
      state: form.state, zip: form.zip,
    };

    return {
      customer_name: `${form.firstName} ${form.lastName}`,
      customer_email: form.email,
      shipping_address: shippingAddress,
      items: items.map((i) => ({
        product_id: i.product.id,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
      })),
      promo_code: promo?.valid ? promo.code : undefined,
      payment_method: method,
    };
  };

  const createPendingOrder = async (method: PaymentMethod) => {
    if (pendingOrderIdRef.current && pendingOrderMethodRef.current === method) return pendingOrderIdRef.current;

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildOrderPayload(method)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to place order');

    const id = data.order?.id as string | undefined;
    if (!id) throw new Error('Order was not created');
    pendingOrderIdRef.current = id;
    pendingOrderMethodRef.current = method;
    setPendingOrderId(id);
    return id;
  };

  const finishOrder = (id: string) => {
    setOrderRef(`KDSL-${id.slice(0, 8).toUpperCase()}`);
    setComplete(true);
    clearCart();
  };

  useEffect(() => {
    if (step !== 2 || paymentMethod !== 'paypal' || complete) return;

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setOrderError('PayPal client ID is not configured.');
      return;
    }

    const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ?? 'USD';
    const renderKey = `${clientId}-${currency}-${pendingOrderId || 'new'}`;
    if (paypalRenderedRef.current === renderKey) return;

    const container = document.getElementById('paypal-button-container');
    if (container) container.innerHTML = '';

    loadScript(
      `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&components=buttons`,
      'paypal-sdk'
    )
      .then(() => {
        if (!window.paypal) throw new Error('PayPal SDK is not available');
        paypalRenderedRef.current = renderKey;
        return window.paypal.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'paypal' },
          createOrder: async () => {
            setOrderError('');
            const internalOrderId = await createPendingOrder('paypal');
            const res = await fetch('/api/payments/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_id: internalOrderId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Could not create PayPal order');
            return data.id;
          },
          onApprove: async (data: { orderID: string }) => {
            const internalOrderId = pendingOrderIdRef.current;
            const res = await fetch('/api/payments/paypal/capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_id: internalOrderId, paypal_order_id: data.orderID }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error ?? 'Could not capture PayPal payment');
            finishOrder(internalOrderId);
          },
          onError: (error: unknown) => {
            setOrderError(error instanceof Error ? error.message : 'PayPal payment failed');
          },
        }).render('#paypal-button-container');
      })
      .catch((error) => setOrderError(error instanceof Error ? error.message : 'Could not load PayPal'));
  }, [step, paymentMethod, complete, pendingOrderId]);

  const handleConfirm = async () => {
    setPlacing(true);
    setOrderError('');

    try {
      if (paymentMethod === 'paypal') return;

      // Save shipping address to profile if requested
      if (user && saveAsDefault) {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ default_address: buildOrderPayload(paymentMethod).shipping_address }),
        });
      }

      if (paymentMethod === 'bank_transfer') {
        const orderId = await createPendingOrder(paymentMethod);
        finishOrder(orderId);
        return;
      }

      const orderId = await createPendingOrder(paymentMethod);
      clearCart();
      await loadScript('https://www.payhere.lk/lib/payhere.js', 'payhere-sdk');
      if (!window.payhere) throw new Error('PayHere SDK is not available');

      const sessionRes = await fetch('/api/payments/payhere/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      const payment = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(payment.error ?? 'Could not start PayHere payment');

      window.payhere.onCompleted = async (completedOrderId) => {
        try {
          const res = await fetch('/api/payments/payhere/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderId,
              payment_reference: completedOrderId || payment.order_id,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? 'Could not confirm PayHere payment');
          finishOrder(orderId);
        } catch (error) {
          setOrderError(error instanceof Error ? error.message : 'Could not confirm PayHere payment');
        }
      };
      window.payhere.onDismissed = () => {
        setOrderError('PayHere payment was cancelled.');
        router.push('/account?tab=orders');
      };
      window.payhere.onError = (error) => setOrderError(error || 'PayHere payment failed.');
      window.payhere.startPayment(payment);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  /* ── Success screen ── */
  if (complete) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className={`container ${styles.successWrap}`} id="checkout-success">
            <div className={styles.successCard}>
              <div className={styles.successIcon}><CheckCircle size={48} strokeWidth={1.5} /></div>
              <h1 className={styles.successTitle}>Order Confirmed!</h1>
              <p className={styles.successText}>
                Thank you for shopping with KDSL Clothing. Your order is being prepared and you&apos;ll receive a confirmation email shortly.
              </p>
              <div className={styles.orderRef}>
                <span>Order Reference</span>
                <strong>#{orderRef}</strong>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link href="/account" className={styles.accountBtn} id="checkout-view-orders">
                  View Order History
                </Link>
                <Link href="/collections" className="btn-primary" id="checkout-continue-shopping">
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Auth modal — shown when guest tries to checkout */}
        {!authLoading && !user && <CheckoutAuthModal />}

        <div className="container">
          <Link href="/cart" className={styles.backLink} id="checkout-back">
            <ArrowLeft size={16} /><span>Back to Cart</span>
          </Link>
          <h1 className={styles.title}>Checkout</h1>

          {/* Step Progress */}
          <div className={styles.stepBar} id="checkout-steps">
            {steps.map((s, i) => (
              <div key={s} className={styles.stepItem}>
                <div className={`${styles.stepDot} ${i <= step ? styles.stepActive : ''}`}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`${styles.stepLabel} ${i <= step ? styles.stepLabelActive : ''}`}>{s}</span>
                {i < steps.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineFilled : ''}`} />}
              </div>
            ))}
          </div>

          <div className={styles.layout}>
            <div className={styles.formArea}>

              {/* ── Step 0: Shipping ── */}
              {step === 0 && (
                <div className={styles.formCard} id="checkout-shipping">
                  <div className={styles.formCardHeader}>
                    <Truck size={18} />
                    <h2>Shipping Information</h2>
                  </div>

                  {/* Saved address banner */}
                  {savedAddress && usingSaved && !showAddressForm && (
                    <div className={styles.savedAddressBanner}>
                      <div className={styles.savedAddressContent}>
                        <MapPin size={16} className={styles.savedAddressIcon} />
                        <div>
                          <div className={styles.savedAddressTitle}>Delivering to saved address</div>
                          <div className={styles.savedAddressText}>
                            {form.address}, {form.city}
                            {form.state ? `, ${form.state}` : ''}
                          </div>
                        </div>
                      </div>
                      <button className={styles.changAddressBtn} onClick={useDifferentAddress}>
                        <ChevronDown size={14} />
                        Use different address
                      </button>
                    </div>
                  )}

                  {/* Saved address card when not using saved */}
                  {savedAddress && !usingSaved && showAddressForm && (
                    <div className={styles.useSavedBanner}>
                      <div className={styles.savedAddressContent}>
                        <MapPin size={16} className={styles.savedAddressIcon} />
                        <div>
                          <div className={styles.savedAddressTitle}>You have a saved address</div>
                          <div className={styles.savedAddressText}>
                            {savedAddress.address}, {savedAddress.city}
                          </div>
                        </div>
                      </div>
                      <button className={styles.useSavedBtn} onClick={applySavedAddress}>
                        Use this address
                      </button>
                    </div>
                  )}

                  {/* Address form */}
                  {showAddressForm && (
                    <div className={styles.formGrid}>
                      {[
                        { id: 'firstName', label: 'First Name', ph: 'John', half: true, type: 'text' },
                        { id: 'lastName', label: 'Last Name', ph: 'Doe', half: true, type: 'text' },
                        { id: 'email', label: 'Email Address', ph: 'john@example.com', half: true, type: 'email' },
                        { id: 'phone', label: 'Phone Number', ph: '+94 77 000 0000', half: true, type: 'tel' },
                        { id: 'address', label: 'Street Address', ph: '123 Main Street', half: false, type: 'text' },
                        { id: 'city', label: 'City', ph: 'Colombo', half: true, type: 'text' },
                        { id: 'state', label: 'Province', ph: 'Western', half: true, type: 'text' },
                        { id: 'zip', label: 'Postal Code', ph: '00100', half: true, type: 'text' },
                      ].map((f) => (
                        <div key={f.id} className={`${styles.fieldGroup} ${f.half ? styles.half : ''}`}>
                          <label className={styles.label} htmlFor={`checkout-${f.id}`}>{f.label}</label>
                          <input
                            id={`checkout-${f.id}`}
                            type={f.type}
                            className={`${styles.input} ${fieldErrors[f.id] ? styles.inputError : ''}`}
                            placeholder={f.ph}
                            value={form[f.id as keyof typeof form]}
                            onChange={(e) => set(f.id, e.target.value)}
                          />
                          {fieldErrors[f.id] && (
                            <span className={styles.fieldError}>{fieldErrors[f.id]}</span>
                          )}
                        </div>
                      ))}

                      {/* Save as default checkbox */}
                      {user && (
                        <div className={`${styles.fieldGroup} ${styles.checkboxGroup}`} style={{ gridColumn: '1/-1' }}>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={saveAsDefault}
                              onChange={(e) => setSaveAsDefault(e.target.checked)}
                              id="checkout-save-address"
                            />
                            <span>Save this address for future orders</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    className="btn-primary"
                    onClick={goToPayment}
                    id="checkout-to-payment"
                    style={{ marginTop: 8 }}
                  >
                    <span>Continue to Payment</span>
                  </button>
                </div>
              )}

              {/* ── Step 1: Payment ── */}
              {step === 1 && (
                <div className={styles.formCard} id="checkout-payment">
                  <div className={styles.formCardHeader}>
                    <CreditCard size={18} />
                    <h2>Payment Details</h2>
                  </div>

                  <div className={styles.paymentMethodGrid}>
                    {PAYMENT_METHODS.map((option) => {
                      const Icon = option.icon;
                      const selected = paymentMethod === option.id;
                      return (
                        <button
                          type="button"
                          key={option.id}
                          className={`${styles.paymentOption} ${selected ? styles.paymentOptionSelected : ''} ${option.disabled ? styles.paymentOptionDisabled : ''}`}
                          disabled={option.disabled}
                          onClick={() => {
                            if (option.disabled) return;
                            setPaymentMethod(option.id);
                            setFieldErrors({});
                          }}
                        >
                          <span className={styles.paymentOptionIcon}><Icon size={18} /></span>
                          <span className={styles.paymentOptionText}>
                            <strong>
                              {option.label}
                              {option.badge && <span className={styles.paymentBadge}>{option.badge}</span>}
                            </strong>
                            <span>{option.summary}</span>
                          </span>
                          <span className={styles.paymentOptionRadio}>{selected && <Check size={13} />}</span>
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === 'card' && (
                    <div className={styles.paymentNotice}>
                      You will be redirected to PayHere sandbox checkout to enter debit or credit card details securely.
                    </div>
                  )}

                  {paymentMethod === 'paypal' && (
                    <div className={styles.paymentNotice}>
                      PayPal payment instructions will be sent to {form.email || 'your email'} after the order is placed.
                    </div>
                  )}

                  {paymentMethod === 'bank_transfer' && (
                    <div className={styles.paymentNotice}>
                      <div className={styles.bankDetailsBlock}>
                        <strong>{process.env.NEXT_PUBLIC_BANK_NAME ?? 'Bank Name'}</strong><br />
                        Account name: {process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? 'KDSL Clothing'}<br />
                        Account number: {process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? 'Add account number in env'}<br />
                        Branch: {process.env.NEXT_PUBLIC_BANK_BRANCH ?? 'Add branch in env'}
                      </div>
                      <div className={styles.bankInstructionBlock}>
                        Use your order reference as the transfer note. After payment, send the payment slip via WhatsApp to 0757381568. Your order will stay pending until payment is confirmed.<br />
                        ඔබේ order reference එක transfer note එක ලෙස යොදන්න. Payment කළ පසු payment slip එක WhatsApp හරහා 0757381568 ට එවන්න. Payment confirm කරන තුරු ඔබේ order එක pending ලෙස පවතී.
                      </div>
                    </div>
                  )}

                  <div className={styles.stepBtns}>
                    <button className="btn-outline" onClick={() => setStep(0)}>Back</button>
                    <button className="btn-primary" onClick={goToConfirm} id="checkout-to-confirm">
                      <span>Review Order</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Confirm ── */}
              {step === 2 && (
                <div className={styles.formCard} id="checkout-confirm">
                  <div className={styles.formCardHeader}>
                    <Package size={18} />
                    <h2>Review Your Order</h2>
                  </div>
                  <div className={styles.reviewItems}>
                    {items.map((item) => {
                      const s = getSalePrice(item.product.id, item.product.price);
                      const unitPrice = s ? s.salePrice : item.product.price;
                      return (
                        <div key={`${item.product.id}-${item.size}`} className={styles.reviewItem}>
                          <span className={styles.reviewName}>{item.product.name}</span>
                          <span className={styles.reviewMeta}>Size: {item.size} · Qty: {item.quantity}</span>
                          <span className={styles.reviewPrice}>LKR {(unitPrice * item.quantity).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.reviewAddress}>
                    <strong>Shipping to:</strong> {form.firstName} {form.lastName}, {form.address}, {form.city}
                  </div>
                  <div className={styles.reviewAddress}>
                    <strong>Payment:</strong> {paymentLabel(paymentMethod)}
                  </div>
                  {orderError && (
                    <div className={styles.promoErrorSmall} style={{ fontSize: 12, marginTop: 12 }}>
                      {orderError}
                    </div>
                  )}
                  <div className={styles.stepBtns}>
                    <button className="btn-outline" onClick={() => setStep(1)}>Back</button>
                    {paymentMethod === 'paypal' ? (
                      <div style={{ minWidth: 220, flex: 1 }}>
                        <div id="paypal-button-container" />
                      </div>
                    ) : (
                      <button className="btn-primary" onClick={handleConfirm} id="checkout-place-order" disabled={placing}>
                        <span>
                          {placing
                            ? 'Processing…'
                            : paymentMethod === 'card'
                              ? `Pay with PayHere · LKR ${total.toLocaleString()}`
                              : `Place Bank Transfer Order · LKR ${total.toLocaleString()}`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className={styles.sidebar} id="checkout-order-summary">
              <h2 className={styles.sidebarTitle}>Order Summary</h2>
              <div className={styles.sidebarItems}>
                {items.map((item) => {
                  const s = getSalePrice(item.product.id, item.product.price);
                  const unitPrice = s ? s.salePrice : item.product.price;
                  return (
                    <div key={`${item.product.id}-${item.size}`} className={styles.sidebarItem}>
                      <span className={styles.sidebarName}>{item.product.name}</span>
                      <span className={styles.sidebarQty}>×{item.quantity}</span>
                      <span className={styles.sidebarPrice}>LKR {(unitPrice * item.quantity).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>

              {/* Promo code in checkout sidebar */}
              <div className={styles.checkoutPromo}>
                {promo?.valid ? (
                  <div className={styles.promoAppliedSmall}>
                    <Tag size={12} />
                    <span>{promo.code} — {promo.discountLabel}</span>
                    <button onClick={handleRemovePromo} className={styles.promoRemoveSmall} aria-label="Remove"><X size={12} /></button>
                  </div>
                ) : (
                  <div className={styles.promoRowSmall}>
                    <input
                      className={styles.promoInputSmall}
                      placeholder="Promo code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                      id="checkout-promo-input"
                    />
                    <button
                      className={styles.promoBtnSmall}
                      onClick={handleApplyPromo}
                      disabled={validatingPromo || !promoInput.trim()}
                      id="checkout-promo-apply"
                    >
                      {validatingPromo ? <Loader size={11} className={styles.spin} /> : 'Apply'}
                    </button>
                  </div>
                )}
                {promo && !promo.valid && <p className={styles.promoErrorSmall}>{promo.message}</p>}
              </div>

              <div className={styles.sidebarTotals}>
                <div className={styles.sidebarLine}>
                  <span>Subtotal</span><span>LKR {effectiveSubtotal.toLocaleString()}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className={`${styles.sidebarLine} ${styles.sidebarDiscount}`}>
                    <span>Promo ({promo?.code})</span><span>-LKR {promoDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className={styles.sidebarLine}>
                  <span>Shipping</span>
                  <span className={shipping === 0 ? styles.free : ''}>
                    {shipping === 0 ? 'Free' : `LKR ${shipping.toLocaleString()}`}
                  </span>
                </div>
                <div className={`${styles.sidebarLine} ${styles.sidebarTotal}`}>
                  <span>Total</span><span>LKR {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
