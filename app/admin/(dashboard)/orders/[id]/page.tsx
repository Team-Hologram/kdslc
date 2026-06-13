'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, CheckCircle, Truck, Clock, XCircle, Save } from 'lucide-react';
import Link from 'next/link';

const STATUS_ICONS: Record<string, any> = {
  payment_pending: Clock, paid: CheckCircle, pending: Clock, processing: Package, shipped: Truck,
  delivered: CheckCircle, cancelled: XCircle,
};
const STATUS_COLORS: Record<string, string> = {
  payment_pending: '#f59e0b', paid: '#22c55e', pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6',
  delivered: '#22c55e', cancelled: '#ef4444',
};
const STATUSES = ['payment_pending', 'paid', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function fmtLKR(n: number) { return `LKR ${n.toLocaleString('en-LK')}`; }
function fmtPayment(method?: string | null) {
  const labels: Record<string, string> = {
    card: 'Debit or Credit Card',
    paypal: 'PayPal',
    bank_transfer: 'Bank Transfer',
  };
  return labels[method ?? ''] ?? 'Debit or Credit Card';
}
function fmtDate(s: string) {
  return new Date(s).toLocaleString('en-LK', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export default function OrderDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d);
        setNewStatus(d.status);
        setTracking(d.tracking_number ?? '');
        setNotes(d.notes ?? '');
        setLoading(false);
      });
  }, [id]);

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, tracking_number: tracking, notes }),
    });
    const updated = await res.json();
    setOrder(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return (
    <><div className="adminHeader"><h1 className="adminHeaderTitle">Order Detail</h1></div>
      <div className="adminContent"><div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div></div></>
  );
  if (!order) return (
    <><div className="adminHeader"><h1 className="adminHeaderTitle">Order Not Found</h1></div>
      <div className="adminContent"><Link href="/admin/orders" className="btnSecondary"><ArrowLeft size={14} /> Back</Link></div></>
  );

  const addr = order.shipping_address ?? {};
  const history: any[] = order.status_history ?? [];

  return (
    <>
      <div className="adminHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/orders" className="btnIcon"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="adminHeaderTitle">Order #{order.id.slice(0, 8)}</h1>
            <div style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(order.created_at)}</div>
          </div>
        </div>
        <button className="btnPrimary" onClick={save} disabled={saving}>
          {saving ? '…' : saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>

      <div className="adminContent">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Items */}
            <div className="adminCard">
              <div className="adminCardHeader"><span className="adminCardTitle">Order Items</span></div>
              <table className="adminTable">
                <thead><tr><th>Product</th><th>Size</th><th>Color</th><th>Qty</th><th>Price</th></tr></thead>
                <tbody>
                  {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>{item.size ?? '—'}</td>
                      <td>{item.color ?? '—'}</td>
                      <td>{item.quantity ?? 1}</td>
                      <td style={{ fontWeight: 700 }}>{fmtLKR((item.price ?? 0) * (item.quantity ?? 1))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Subtotal</span><span>{fmtLKR(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e' }}>
                    <span>Discount ({order.promo_code})</span><span>−{fmtLKR(order.discount_amount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Shipping</span><span>{order.shipping_fee === 0 ? 'FREE' : fmtLKR(order.shipping_fee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, paddingTop: 8, borderTop: '1px solid #e2e8f0', marginTop: 4 }}>
                  <span>Total</span><span>{fmtLKR(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="adminCard">
              <div className="adminCardHeader"><span className="adminCardTitle">Status History</span></div>
              <div className="adminCardBody">
                <div className="timeline">
                  {/* Current status */}
                  <div className="timelineItem">
                    <div className="timelineDot" style={{ background: STATUS_COLORS[order.status] + '22', color: STATUS_COLORS[order.status] }}>
                      {(() => { const Icon = STATUS_ICONS[order.status] ?? Clock; return <Icon size={14} />; })()}
                    </div>
                    <div className="timelineLine" />
                    <div className="timelineContent">
                      <div className="timelineTitle" style={{ textTransform: 'capitalize' }}>Current: {String(order.status).replace('_', ' ')}</div>
                      <div className="timelineMeta">{fmtDate(order.updated_at ?? order.created_at)}</div>
                    </div>
                  </div>
                  {history.slice().reverse().map((h: any, i: number) => (
                    <div key={i} className="timelineItem">
                      <div className="timelineDot" style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                        {(() => { const Icon = STATUS_ICONS[h.to] ?? Clock; return <Icon size={14} />; })()}
                      </div>
                      <div className="timelineLine" />
                      <div className="timelineContent">
                        <div className="timelineTitle" style={{ textTransform: 'capitalize' }}>
                        {String(h.from).replace('_', ' ')} → {String(h.to).replace('_', ' ')}
                        </div>
                        <div className="timelineMeta">{fmtDate(h.timestamp)} · by {h.by}</div>
                      </div>
                    </div>
                  ))}
                  <div className="timelineItem">
                    <div className="timelineDot" style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                      <CheckCircle size={14} />
                    </div>
                    <div className="timelineContent">
                      <div className="timelineTitle">Order Placed</div>
                      <div className="timelineMeta">{fmtDate(order.created_at)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Update panel */}
            <div className="adminCard">
              <div className="adminCardHeader"><span className="adminCardTitle">Update Order</span></div>
              <div className="adminCardBody" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="formGroup">
                  <label className="formLabel">Status</label>
                  <select className="adminSelect" style={{ width: '100%', height: 40 }} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="formGroup">
                  <label className="formLabel">Tracking Number</label>
                  <input className="adminInput" placeholder="e.g. SL1234567890" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Internal Notes</label>
                  <textarea className="adminTextarea" style={{ minHeight: 80 }} placeholder="Notes visible only to admin" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className="adminCard">
              <div className="adminCardHeader"><span className="adminCardTitle">Customer</span></div>
              <div className="adminCardBody" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div><strong>{order.customer_name ?? '—'}</strong></div>
                <div style={{ color: '#64748b' }}>{order.customer_email}</div>
              </div>
            </div>

            {/* Payment */}
            <div className="adminCard">
              <div className="adminCardHeader"><span className="adminCardTitle">Payment</span></div>
              <div className="adminCardBody" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div><strong>{fmtPayment(order.payment_method)}</strong></div>
                <div style={{ color: '#64748b', textTransform: 'capitalize' }}>{(order.payment_status ?? 'pending').replace('_', ' ')}</div>
                {order.payment_reference && <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>{order.payment_reference}</div>}
                {order.paid_at && <div style={{ color: '#64748b' }}>Paid: {fmtDate(order.paid_at)}</div>}
              </div>
            </div>

            {/* Shipping */}
            <div className="adminCard">
              <div className="adminCardHeader"><span className="adminCardTitle">Shipping Address</span></div>
              <div className="adminCardBody" style={{ fontSize: 13, lineHeight: 1.7, color: '#1e293b' }}>
                {addr.fullName && <div><strong>{addr.fullName}</strong></div>}
                {addr.addressLine1 && <div>{addr.addressLine1}</div>}
                {addr.addressLine2 && <div>{addr.addressLine2}</div>}
                {(addr.city || addr.province) && <div>{[addr.city, addr.province].filter(Boolean).join(', ')}</div>}
                {addr.postalCode && <div>{addr.postalCode}</div>}
                {addr.phone && <div style={{ color: '#64748b', marginTop: 4 }}>📞 {addr.phone}</div>}
                {!addr.fullName && <div style={{ color: '#94a3b8' }}>No address recorded</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
