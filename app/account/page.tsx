'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package, Heart, User, LogOut, ChevronDown,
  Truck, MapPin, Edit2, Check, X, ShoppingBag,
  Clock, CheckCircle2, AlertCircle, CreditCard, Landmark
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlist } from '@/contexts/WatchlistContext';
import styles from './account.module.css';

/* ── Types ── */
interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
  phone?: string;
}

interface OrderItem {
  name: string;
  product_id: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  status: 'payment_pending' | 'paid' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customer_name: string;
  customer_email: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method?: 'card' | 'paypal' | 'bank_transfer' | null;
  payment_status?: string | null;
  payment_reference?: string | null;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  default_address: ShippingAddress | null;
}

/* ── Helpers ── */
const STATUS_CONFIG = {
  payment_pending: { label: 'Payment Pending', cls: styles.badgePaymentPending, icon: Clock },
  paid:       { label: 'Payment Confirmed', cls: styles.badgeProcessing, icon: CheckCircle2 },
  pending:    { label: 'Order Received', cls: styles.badgePending,    icon: Clock },
  processing: { label: 'Being Prepared', cls: styles.badgeProcessing, icon: Package },
  shipped:    { label: 'On Its Way',     cls: styles.badgeShipped,    icon: Truck },
  delivered:  { label: 'Delivered',      cls: styles.badgeDelivered,  icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',      cls: styles.badgeCancelled,  icon: AlertCircle },
} as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtRef(id: string) {
  return `KDSL-${id.slice(0, 8).toUpperCase()}`;
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

declare global {
  interface Window {
    payhere?: {
      startPayment: (payment: Record<string, unknown>) => void;
      onCompleted?: (orderId: string) => void;
      onDismissed?: () => void;
      onError?: (error: string) => void;
    };
  }
}

/* ── Component ── */
export default function AccountPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { count: watchlistCount } = useWatchlist();
  const router = useRouter();

  const [tab, setTab] = useState<'overview' | 'orders' | 'profile'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Address form state
  const EMPTY_ADDR = { firstName: '', lastName: '', phone: '', address: '', city: '', state: '', zip: '' };
  const [addrEditMode, setAddrEditMode] = useState(false);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR);
  const [savingAddr, setSavingAddr] = useState(false);
  const [payingOrder, setPayingOrder] = useState<string | null>(null);
  const [bankOrder, setBankOrder] = useState<Order | null>(null);

  // Redirect guests
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?next=/account');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('tab') === 'orders') {
      setTab('orders');
    }
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    const [profileRes, ordersRes] = await Promise.all([
      fetch('/api/profile'),
      fetch('/api/orders'),
    ]);
    const { profile: p } = await profileRes.json();
    const { orders: o } = await ordersRes.json();
    setProfile(p);
    setOrders(o ?? []);
    setEditForm({
      full_name: p?.full_name ?? user.user_metadata?.full_name ?? '',
      phone: p?.phone ?? '',
    });
    setLoadingData(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const { profile: updated } = await res.json();
    setProfile(updated);
    setSaving(false);
    setEditMode(false);
    showToast('Profile updated successfully!');
  };

  const handleRemoveAddress = async () => {
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_address: null }),
    });
    setProfile((p) => p ? { ...p, default_address: null } : p);
    setAddrEditMode(false);
    showToast('Address removed.');
  };

  const openAddrForm = () => {
    const a = profile?.default_address;
    setAddrForm({
      firstName: a?.firstName ?? '',
      lastName: a?.lastName ?? '',
      phone: a?.phone ?? profile?.phone ?? '',
      address: a?.address ?? '',
      city: a?.city ?? '',
      state: a?.state ?? '',
      zip: a?.zip ?? '',
    });
    setAddrEditMode(true);
  };

  const handleSaveAddress = async () => {
    if (!addrForm.address.trim() || !addrForm.city.trim()) {
      showToast('Address and city are required.');
      return;
    }
    setSavingAddr(true);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_address: addrForm }),
    });
    const { profile: updated } = await res.json();
    setProfile(updated);
    setSavingAddr(false);
    setAddrEditMode(false);
    showToast('Address saved successfully!');
  };

  const handlePayNow = async (order: Order) => {
    setPayingOrder(order.id);
    try {
      await loadScript('https://www.payhere.lk/lib/payhere.js', 'payhere-sdk');
      if (!window.payhere) throw new Error('PayHere SDK is not available');

      const sessionRes = await fetch('/api/payments/payhere/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id }),
      });
      const payment = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(payment.error ?? 'Could not start PayHere payment');

      window.payhere.onCompleted = async (completedOrderId) => {
        const res = await fetch('/api/payments/payhere/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            payment_reference: completedOrderId || payment.order_id,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error ?? 'Could not confirm payment.');
          return;
        }
        showToast('Payment confirmed.');
        fetchData();
      };
      window.payhere.onDismissed = () => showToast('Payment is still pending.');
      window.payhere.onError = (error) => showToast(error || 'Payment failed.');
      window.payhere.startPayment(payment);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not start payment.');
    } finally {
      setPayingOrder(null);
    }
  };

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const initial = displayName[0].toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : '';

  const addr = profile?.default_address;

  if (authLoading || !user) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className="container">
            <div className={styles.skeleton} style={{ height: 120, borderRadius: 20, marginBottom: 24 }} />
            <div className={styles.skeleton} style={{ height: 80, borderRadius: 16 }} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.main} id="account-main">

        {/* ── Profile Hero ── */}
        <div className={styles.pageHeader}>
          <div className="container">
            <div className={styles.profileHero}>
              <div className={styles.profileAvatar}>{initial}</div>
              <div className={styles.profileInfo}>
                <h1 className={styles.profileName}>{displayName}</h1>
                <p className={styles.profileEmail}>{user.email}</p>
                {memberSince && <p className={styles.profileMeta}>Member since {memberSince}</p>}
              </div>
              <button
                className={styles.signOutBtn}
                onClick={() => signOut()}
                id="account-signout"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        <div className="container">

          {/* ── Stats ── */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.teal}`}><Package size={20} /></div>
              <div>
                <div className={styles.statNum}>{orders.length}</div>
                <div className={styles.statLabel}>Total Orders</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.purple}`}><Heart size={20} /></div>
              <div>
                <div className={styles.statNum}>{watchlistCount}</div>
                <div className={styles.statLabel}>Watchlist Items</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.amber}`}><CheckCircle2 size={20} /></div>
              <div>
                <div className={styles.statNum}>
                  {orders.filter((o) => o.status === 'delivered').length}
                </div>
                <div className={styles.statLabel}>Delivered</div>
              </div>
            </div>
          </div>

          {/* ── Tab Nav ── */}
          <div className={styles.tabNav} id="account-tabs">
            {([
              { id: 'overview', label: 'Overview',  icon: User },
              { id: 'orders',   label: 'Orders',    icon: Package },
              { id: 'profile',  label: 'Settings',  icon: Edit2 },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`${styles.tabBtn} ${tab === id ? styles.tabBtnActive : ''}`}
                onClick={() => setTab(id)}
                id={`account-tab-${id}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Overview Tab ── */}
          {tab === 'overview' && (
            <div>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}><Package size={16} /> Recent Orders</h2>
                {orders.length > 3 && (
                  <button className={styles.editBtn} onClick={() => setTab('orders')}>
                    View all
                  </button>
                )}
              </div>

              {loadingData ? (
                <div className={styles.ordersList}>
                  {[1, 2].map((i) => (
                    <div key={i} className={styles.skeleton} style={{ height: 72, borderRadius: 16 }} />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><ShoppingBag size={24} /></div>
                  <p className={styles.emptyTitle}>No orders yet</p>
                  <p className={styles.emptyText}>Your order history will appear here after your first purchase.</p>
                  <Link href="/collections" className="btn-primary" id="account-shop-link">
                    <span>Start Shopping</span>
                  </Link>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {orders.slice(0, 4).map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      expanded={expandedOrder === order.id}
                      onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      onPayNow={handlePayNow}
                      onBankDetails={setBankOrder}
                      paying={payingOrder === order.id}
                    />
                  ))}
                </div>
              )}

              {/* Saved address quick-view */}
              {addr && (
                <div style={{ marginTop: 24 }}>
                  <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}><MapPin size={16} /> Saved Address</h2>
                  </div>
                  <div className={styles.addressCard}>
                    <p className={styles.addressLine}>
                      {[addr.firstName, addr.lastName].filter(Boolean).join(' ')}<br />
                      {addr.address}<br />
                      {[addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}<br />
                      {addr.phone && `📞 ${addr.phone}`}
                    </p>
                    <button className={styles.cancelBtn} onClick={handleRemoveAddress}>
                      Remove address
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Orders Tab ── */}
          {tab === 'orders' && (
            <div>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}><Package size={16} /> All Orders ({orders.length})</h2>
              </div>
              {loadingData ? (
                <div className={styles.ordersList}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={styles.skeleton} style={{ height: 72, borderRadius: 16 }} />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><Package size={24} /></div>
                  <p className={styles.emptyTitle}>No orders yet</p>
                  <p className={styles.emptyText}>Your complete order history will appear here.</p>
                  <Link href="/collections" className="btn-primary">
                    <span>Browse Collections</span>
                  </Link>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      expanded={expandedOrder === order.id}
                      onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      onPayNow={handlePayNow}
                      onBankDetails={setBankOrder}
                      paying={payingOrder === order.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Profile / Settings Tab ── */}
          {tab === 'profile' && (
            <div>
              {/* Profile Edit */}
              <div className={styles.profileCard}>
                <p className={styles.profileCardTitle}><User size={15} /> Personal Information</p>
                <div className={styles.profileGrid}>
                  <div className={styles.profileField}>
                    <label htmlFor="acc-name">Full Name</label>
                    <input
                      id="acc-name"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                      disabled={!editMode}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className={styles.profileField}>
                    <label htmlFor="acc-phone">Phone Number</label>
                    <input
                      id="acc-phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                      disabled={!editMode}
                      placeholder="+94 77 000 0000"
                    />
                  </div>
                  <div className={`${styles.profileField} ${styles.fullWidth}`}>
                    <label>Email Address</label>
                    <input value={user.email ?? ''} disabled />
                  </div>
                </div>
                <div className={styles.profileActions}>
                  {!editMode ? (
                    <button className={styles.editBtn} onClick={() => setEditMode(true)} id="acc-edit-btn">
                      <Edit2 size={13} /> Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        className={styles.saveBtn}
                        onClick={handleSaveProfile}
                        disabled={saving}
                        id="acc-save-btn"
                      >
                        <Check size={13} />
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button className={styles.cancelBtn} onClick={() => setEditMode(false)}>
                        <X size={13} /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Saved Address with full form */}
              <div className={styles.addressCard} style={{ marginTop: 20 }}>
                <p className={styles.profileCardTitle}><MapPin size={15} /> Default Shipping Address</p>

                {!addrEditMode ? (
                  /* ── Display mode ── */
                  addr ? (
                    <>
                      <p className={styles.addressLine}>
                        <strong>{[addr.firstName, addr.lastName].filter(Boolean).join(' ')}</strong><br />
                        {addr.address}<br />
                        {[addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}<br />
                        {addr.phone && `${addr.phone}`}
                      </p>
                      <div className={styles.profileActions}>
                        <button className={styles.editBtn} onClick={openAddrForm} id="acc-addr-edit">
                          <Edit2 size={13} /> Edit Address
                        </button>
                        <button className={styles.cancelBtn} onClick={handleRemoveAddress}>
                          <X size={13} /> Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className={styles.noAddress}>No saved address yet. Add one below for faster checkout.</p>
                      <button className={styles.editBtn} onClick={openAddrForm} id="acc-addr-add">
                        <MapPin size={13} /> Add Address
                      </button>
                    </>
                  )
                ) : (
                  /* ── Edit mode ── */
                  <div>
                    <div className={styles.profileGrid} style={{ marginBottom: 16 }}>
                      {[
                        { id: 'firstName', label: 'First Name', ph: 'John', half: true },
                        { id: 'lastName',  label: 'Last Name',  ph: 'Doe',  half: true },
                        { id: 'phone',     label: 'Phone',      ph: '+94 77 000 0000', half: false },
                        { id: 'address',   label: 'Street Address', ph: '123 Main Street', half: false },
                        { id: 'city',      label: 'City',       ph: 'Colombo', half: true },
                        { id: 'state',     label: 'Province',   ph: 'Western', half: true },
                        { id: 'zip',       label: 'Postal Code', ph: '00100', half: true },
                      ].map((f) => (
                        <div
                          key={f.id}
                          className={`${styles.profileField} ${!f.half ? styles.fullWidth : ''}`}
                        >
                          <label htmlFor={`addr-${f.id}`}>{f.label}</label>
                          <input
                            id={`addr-${f.id}`}
                            value={addrForm[f.id as keyof typeof addrForm]}
                            onChange={(e) => setAddrForm((a) => ({ ...a, [f.id]: e.target.value }))}
                            placeholder={f.ph}
                          />
                        </div>
                      ))}
                    </div>
                    <div className={styles.profileActions}>
                      <button
                        className={styles.saveBtn}
                        onClick={handleSaveAddress}
                        disabled={savingAddr}
                        id="acc-addr-save"
                      >
                        <Check size={13} />
                        {savingAddr ? 'Saving…' : 'Save Address'}
                      </button>
                      <button className={styles.cancelBtn} onClick={() => setAddrEditMode(false)}>
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Watchlist link */}
              <div className={styles.addressCard} style={{ marginTop: 16 }}>
                <p className={styles.profileCardTitle}><Heart size={15} /> Watchlist</p>
                <p className={styles.addressLine} style={{ marginBottom: 12 }}>
                  You have <strong>{watchlistCount}</strong> item{watchlistCount !== 1 ? 's' : ''} saved.
                </p>
                <Link href="/watchlist" className={styles.editBtn} style={{ textDecoration: 'none', display: 'inline-flex' }}>
                  <Heart size={13} /> View Watchlist
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={styles.toast} id="account-toast">
          <Check size={14} /> {toast}
        </div>
      )}

      {bankOrder && (
        <div className={styles.modalOverlay} onClick={() => setBankOrder(null)}>
          <div className={styles.bankModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bankModalHeader}>
              <div>
                <p className={styles.bankModalKicker}>Bank Transfer</p>
                <h2>Payment Details</h2>
              </div>
              <button className={styles.modalClose} onClick={() => setBankOrder(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className={styles.bankRows}>
              <div><span>Reference</span><strong>{fmtRef(bankOrder.id)}</strong></div>
              <div><span>Amount</span><strong>LKR {bankOrder.total.toLocaleString()}</strong></div>
              <div><span>Bank</span><strong>{process.env.NEXT_PUBLIC_BANK_NAME ?? 'Bank Name'}</strong></div>
              <div><span>Account Name</span><strong>{process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? 'KDSL Clothing'}</strong></div>
              <div><span>Account Number</span><strong>{process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? 'Add account number in env'}</strong></div>
              <div><span>Branch</span><strong>{process.env.NEXT_PUBLIC_BANK_BRANCH ?? 'Add branch in env'}</strong></div>
            </div>
            <p className={styles.bankNote}>
              Use the reference number above as your transfer note. After payment, send the payment slip via WhatsApp to <strong>0757381568</strong> so we can confirm your order faster.
              <br />
              ඉහත reference number එක transfer note එක ලෙස යොදන්න. Payment කළ පසු payment slip එක WhatsApp හරහා <strong>0757381568</strong> ට එවන්න.
            </p>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

/* ── Order Card Sub-component ── */
function OrderCard({
  order,
  expanded,
  onToggle,
  onPayNow,
  onBankDetails,
  paying,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onPayNow: (order: Order) => void;
  onBankDetails: (order: Order) => void;
  paying: boolean;
}) {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const addr = order.shipping_address;
  const isPaymentPending = order.status === 'payment_pending' || order.payment_status === 'payment_pending';
  const isPayHerePending = isPaymentPending && order.payment_method === 'card';
  const isBankPending = isPaymentPending && order.payment_method === 'bank_transfer';

  return (
    <div className={styles.orderCard}>
      <div className={styles.orderCardTop} onClick={onToggle} role="button" tabIndex={0}>
        <span className={styles.orderRef}>{fmtRef(order.id)}</span>
        <span className={styles.orderDate}>{fmtDate(order.created_at)}</span>
        <span className={`${styles.badge} ${cfg.cls}`}>
          <span className={styles.statusDot} />
          {cfg.label}
        </span>
        <span className={styles.orderTotal}>LKR {order.total.toLocaleString()}</span>
        <ChevronDown
          size={16}
          className={`${styles.expandChevron} ${expanded ? styles.expandChevronOpen : ''}`}
        />
      </div>

      {expanded && (
        <div className={styles.orderDetail}>
          {/* Items */}
          <div>
            <div className={styles.orderDetailLabel} style={{ marginBottom: 8 }}>Items Ordered</div>
            <div className={styles.orderItems}>
              {(order.items as OrderItem[]).map((item, i) => (
                <div key={i} className={styles.orderItem}>
                  <span className={styles.orderItemName}>{item.name}</span>
                  <span className={styles.orderItemMeta}>
                    Size: {item.size} · Qty: {item.quantity}
                  </span>
                  <span className={styles.orderItemPrice}>
                    LKR {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid: shipping + totals */}
          <div className={styles.orderDetailGrid}>
            <div className={styles.orderDetailSection}>
              <div className={styles.orderDetailLabel}>Delivery Address</div>
              <div className={styles.orderDetailValue}>
                {order.customer_name}<br />
                {addr?.address}<br />
                {[addr?.city, addr?.state, addr?.zip].filter(Boolean).join(', ')}<br />
                {addr?.phone}
              </div>
            </div>
            <div className={styles.orderDetailSection}>
              <div className={styles.orderDetailLabel}>Order Summary</div>
              <div className={styles.orderDetailValue}>
                Subtotal: LKR {order.subtotal.toLocaleString()}<br />
                Shipping: {order.shipping_fee === 0 ? 'Free' : `LKR ${order.shipping_fee.toLocaleString()}`}<br />
                <strong>Total: LKR {order.total.toLocaleString()}</strong>
              </div>
            </div>
          </div>
          {isPaymentPending && (
            <div className={styles.orderActions}>
              {isPayHerePending && (
                <button className={styles.payNowBtn} onClick={() => onPayNow(order)} disabled={paying}>
                  <CreditCard size={13} /> {paying ? 'Opening…' : 'Pay Now'}
                </button>
              )}
              {isBankPending && (
                <button className={styles.bankDetailsBtn} onClick={() => onBankDetails(order)}>
                  <Landmark size={13} /> View Bank Details
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
