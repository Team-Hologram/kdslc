'use client';
import { useEffect, useState } from 'react';
import {
  TrendingUp, ShoppingBag, Users, Mail,
  Clock, Package, ArrowUpRight, RefreshCw,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

function fmtLKR(n: number) {
  return `LKR ${n.toLocaleString('en-LK')}`;
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending: 'badgePending', processing: 'badgeProcessing',
    shipped: 'badgeShipped', delivered: 'badgeDelivered', cancelled: 'badgeCancelled',
  };
  return (
    <span className={`badge ${cls[status] ?? 'badgeDraft'}`} style={{ textTransform: 'capitalize' }}>
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const stats = data?.stats ?? {};

  const STAT_CARDS = [
    {
      label: 'Total Revenue',
      value: fmtLKR(stats.totalRevenue ?? 0),
      sub: `${fmtLKR(stats.todayRevenue ?? 0)} today`,
      icon: TrendingUp,
      color: '#1ECFC8',
      bg: 'rgba(30,207,200,0.1)',
    },
    {
      label: 'Total Orders',
      value: (stats.totalOrders ?? 0).toString(),
      sub: `${stats.pendingOrders ?? 0} pending`,
      icon: ShoppingBag,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
    },
    {
      label: 'Customers',
      value: (stats.totalUsers ?? 0).toString(),
      sub: `${stats.newUsers7d ?? 0} new this week`,
      icon: Users,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
    },
    {
      label: 'Subscribers',
      value: (stats.subscribers ?? 0).toString(),
      sub: 'Newsletter list',
      icon: Mail,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
    },
  ];

  if (loading) {
    return (
      <div className="adminContent">
        <div className="adminHeader" style={{ position: 'static', padding: '32px 32px 0', background: 'transparent', border: 'none' }}>
          <h1 className="adminHeaderTitle">Dashboard</h1>
        </div>
        <div className="statGrid" style={{ marginTop: 24 }}>
          {[1,2,3,4].map((i) => (
            <div key={i} className="adminCard" style={{ padding: 24 }}>
              <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 32, width: '80%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '50%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="adminHeader">
        <h1 className="adminHeaderTitle">Dashboard</h1>
        <div className="adminHeaderActions">
          <button className="btnSecondary" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <Link href="/admin/orders" className="btnPrimary">
            <ShoppingBag size={14} /> View Orders
          </Link>
        </div>
      </div>

      <div className="adminContent">
        {/* ── Stat Cards ── */}
        <div className="statGrid">
          {STAT_CARDS.map((card) => (
            <div className="adminCard" key={card.label} style={{ padding: 24 }}>
              <div className="statIcon" style={{ background: card.bg, color: card.color }}>
                <card.icon size={20} />
              </div>
              <div className="statLabel">{card.label}</div>
              <div className="statValue" style={{ fontSize: 24 }}>{card.value}</div>
              <div className="statChange" style={{ color: '#64748b', fontSize: 12 }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Revenue Chart */}
          <div className="adminCard">
            <div className="adminCardHeader">
              <span className="adminCardTitle">Revenue — Last 30 Days</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>LKR</span>
            </div>
            <div className="adminCardBody">
              <div className="chartContainer">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.revenueChart ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={4} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: any) => [`LKR ${Number(v).toLocaleString('en-LK')}`, 'Revenue']}
                      contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Line
                      type="monotone" dataKey="revenue" stroke="#1ECFC8"
                      strokeWidth={2.5} dot={false} activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Status Pie */}
          <div className="adminCard">
            <div className="adminCardHeader">
              <span className="adminCardTitle">Order Status</span>
            </div>
            <div className="adminCardBody">
              <div className="chartContainer">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.statusChart ?? []}
                      cx="50%" cy="45%"
                      innerRadius={55} outerRadius={85}
                      dataKey="value"
                      label={({ name, percent }: any) => `${Math.round((percent ?? 0) * 100)}%`}
                      labelLine={false}
                      fontSize={11}
                    >
                      {(data?.statusChart ?? []).map((entry: any, i: number) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => (
                        <span style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{value}</span>
                      )}
                    />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Row: Recent Orders + Top Products ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
          {/* Recent Orders */}
          <div className="adminCard">
            <div className="adminCardHeader">
              <span className="adminCardTitle">Recent Orders</span>
              <Link href="/admin/orders" className="btnSecondary" style={{ fontSize: 12, padding: '6px 12px' }}>
                View All <ArrowUpRight size={13} />
              </Link>
            </div>
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentOrders ?? []).map((o: any) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.id.slice(0, 8)}…</td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{o.customer_name ?? '—'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{o.customer_email}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{fmtLKR(o.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="btnIcon" style={{ width: 'auto', padding: '4px 10px', fontSize: 12, textDecoration: 'none', display: 'inline-flex', gap: 4 }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {!data?.recentOrders?.length && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Top Products */}
          <div className="adminCard">
            <div className="adminCardHeader">
              <span className="adminCardTitle">Top Products</span>
            </div>
            <div className="adminCardBody" style={{ padding: '16px 24px' }}>
              {(data?.topProducts ?? []).map((p: any, i: number) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{
                    width: 28, height: 28, background: '#f1f5f9', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#64748b', flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{p.count} sold · {fmtLKR(p.revenue)}</div>
                  </div>
                </div>
              ))}
              {!data?.topProducts?.length && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>No sales data yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
