'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const STATUSES = ['all', 'payment_pending', 'paid', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function fmtLKR(n: number) { return `LKR ${n.toLocaleString('en-LK')}`; }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' }); }
function fmtPayment(method?: string | null) {
  const labels: Record<string, string> = {
    card: 'Card',
    paypal: 'PayPal',
    bank_transfer: 'Bank Transfer',
  };
  return labels[method ?? ''] ?? 'Card';
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    payment_pending: 'badgePaymentPending', paid: 'badgeActive', pending: 'badgePending', processing: 'badgeProcessing',
    shipped: 'badgeShipped', delivered: 'badgeDelivered', cancelled: 'badgeCancelled',
  };
  return <span className={`badge ${m[status] ?? 'badgeDraft'}`}>{status.replace('_', ' ')}</span>;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (status !== 'all') params.set('status', status);
    try {
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdating(null);
    load();
  };

  return (
    <>
      <div className="adminHeader">
        <h1 className="adminHeaderTitle">Orders <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>({total})</span></h1>
        <button className="btnSecondary" onClick={load}><RefreshCw size={14} /></button>
      </div>

      <div className="adminContent">
        <div className="adminCard">
          {/* Filters */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="adminSearch">
              <Search size={15} />
              <input
                placeholder="Search name, email, order ID…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatus(s); setPage(1); }}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: '1.5px solid',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                    background: status === s ? '#0f172a' : 'white',
                    color: status === s ? 'white' : '#64748b',
                    borderColor: status === s ? '#0f172a' : '#e2e8f0',
                    transition: 'all 0.15s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading orders…</div>
          ) : (
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Update</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.id.slice(0, 8)}…</td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{o.customer_name ?? '—'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{o.customer_email}</div>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(o.created_at)}</td>
                    <td style={{ fontSize: 12 }}>{Array.isArray(o.items) ? o.items.length : '—'}</td>
                    <td style={{ fontSize: 12 }}>{fmtPayment(o.payment_method)}</td>
                    <td style={{ fontWeight: 700 }}>{fmtLKR(o.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      <select
                        className="adminSelect"
                        style={{ height: 32, fontSize: 12, padding: '0 8px' }}
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        disabled={updating === o.id}
                      >
                        {STATUSES.filter((s) => s !== 'all').map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="btnIcon">
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {!orders.length && (
                  <tr><td colSpan={9}>
                    <div className="emptyState">
                      <div className="emptyIcon" style={{ margin: '0 auto 12px' }}>📦</div>
                      <div className="emptyTitle">No orders found</div>
                      <div className="emptyText">Try adjusting your filters</div>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination">
              <span style={{ flex: 1, fontSize: 12 }}>Page {page} of {pages} · {total} orders</span>
              <button className="btnIcon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={14} />
              </button>
              <button className="btnIcon" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
