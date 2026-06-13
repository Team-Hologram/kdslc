'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Tag, Zap, Package } from 'lucide-react';
import { notifyDataChanged } from '@/lib/client-data-events';

function fmtDate(s: string) { return s ? new Date(s).toLocaleDateString('en-LK') : '—'; }

const TABS = [
  { id: 'flash', label: 'Flash Sales', icon: Zap },
  { id: 'promo', label: 'Promo Codes', icon: Tag },
  { id: 'bundles', label: 'Bundle Deals', icon: Package },
];

export default function AdminOffers() {
  const [tab, setTab] = useState('flash');
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const loadAll = async () => {
    setLoading(true);
    const [fs, pc, bd] = await Promise.all([
      fetch('/api/admin/offers/flash-sales').then((r) => r.json()),
      fetch('/api/admin/offers/promo-codes').then((r) => r.json()),
      fetch('/api/admin/offers/bundles').then((r) => r.json()),
    ]);
    setFlashSales(Array.isArray(fs) ? fs : []);
    setPromoCodes(Array.isArray(pc) ? pc : []);
    setBundles(Array.isArray(bd) ? bd : []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const openModal = (type: string, item?: any) => {
    setEditing(item ?? null);
    setErr('');
    if (type === 'flash') {
      setForm(item ? { ...item } : { title: '', discount_percentage: 15, ends_at: '', is_active: false, countdown_label: 'Sale Ends In', free_shipping_enabled: false });
    } else if (type === 'promo') {
      setForm(item ? { ...item } : { code: '', label: '', description: '', discount_type: 'percentage', discount_value: 10, min_order: 0, is_active: true });
    } else {
      setForm(item ? { ...item } : { title: '', subtitle: '', product_ids: [], savings_label: 'Save LKR 2,000', is_active: true });
    }
    setModal(type);
  };

  const save = async (apiPath: string, method: string, body: any) => {
    setSaving(true);
    setErr('');
    try {
      const res = await fetch(apiPath, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? 'Error'); return; }
      setModal(null);
      notifyDataChanged();
      loadAll();
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (apiPath: string, id: string) => {
    if (!confirm('Delete this item?')) return;
    await fetch(apiPath, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    notifyDataChanged();
    loadAll();
  };

  const toggleActive = async (apiPath: string, item: any) => {
    await fetch(apiPath, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
    });
    notifyDataChanged();
    loadAll();
  };

  return (
    <>
      <div className="adminHeader">
        <h1 className="adminHeaderTitle">Offers & Promotions</h1>
        <button className="btnPrimary" onClick={() => openModal(tab)}>
          <Plus size={14} /> Add {TABS.find((t) => t.id === tab)?.label.replace(/s$/, '')}
        </button>
      </div>

      <div className="adminContent">
        {/* Tabs */}
        <div className="adminTabs">
          {TABS.map((t) => (
            <button key={t.id} className={`adminTab ${tab === t.id ? 'activeTab' : ''}`} onClick={() => setTab(t.id)}>
              <t.icon size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Flash Sales ── */}
        {tab === 'flash' && (
          <div className="adminCard">
            {loading ? <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Loading…</div> : (
              <table className="adminTable">
                <thead><tr><th>Title</th><th>Discount</th><th>Ends At</th><th>Free Ship</th><th>Active</th><th>Actions</th></tr></thead>
                <tbody>
                  {flashSales.map((f) => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 700 }}>{f.title}</td>
                      <td><span className="badge badgeActive">{f.discount_percentage}% OFF</span></td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(f.ends_at)}</td>
                      <td><span className={`badge ${f.free_shipping_enabled ? 'badgeActive' : 'badgeDraft'}`}>{f.free_shipping_enabled ? 'Yes' : 'No'}</span></td>
                      <td><button className={`toggle ${f.is_active ? 'on' : ''}`} onClick={() => toggleActive('/api/admin/offers/flash-sales', f)} /></td>
                      <td><div style={{ display: 'flex', gap: 6 }}>
                        <button className="btnIcon" onClick={() => openModal('flash', f)}><Edit2 size={13} /></button>
                        <button className="btnIcon" style={{ color: '#ef4444' }} onClick={() => deleteItem('/api/admin/offers/flash-sales', f.id)}><Trash2 size={13} /></button>
                      </div></td>
                    </tr>
                  ))}
                  {!flashSales.length && <tr><td colSpan={6}><div className="emptyState"><div className="emptyTitle">No flash sales</div><div className="emptyText">Create your first flash sale to show the countdown timer</div></div></td></tr>}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Promo Codes ── */}
        {tab === 'promo' && (
          <div className="adminCard">
            {loading ? <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Loading…</div> : (
              <table className="adminTable">
                <thead><tr><th>Code</th><th>Label</th><th>Type</th><th>Value</th><th>Min Order</th><th>Active</th><th>Actions</th></tr></thead>
                <tbody>
                  {promoCodes.map((p) => (
                    <tr key={p.id}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 800, background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>{p.code}</span></td>
                      <td style={{ fontWeight: 600 }}>{p.label}</td>
                      <td style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{p.discount_type}</td>
                      <td style={{ fontWeight: 700 }}>{p.discount_type === 'percentage' ? `${p.discount_value}%` : `LKR ${p.discount_value}`}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{p.min_order ? `LKR ${p.min_order.toLocaleString()}` : '—'}</td>
                      <td><button className={`toggle ${p.is_active ? 'on' : ''}`} onClick={() => toggleActive('/api/admin/offers/promo-codes', p)} /></td>
                      <td><div style={{ display: 'flex', gap: 6 }}>
                        <button className="btnIcon" onClick={() => openModal('promo', p)}><Edit2 size={13} /></button>
                        <button className="btnIcon" style={{ color: '#ef4444' }} onClick={() => deleteItem('/api/admin/offers/promo-codes', p.id)}><Trash2 size={13} /></button>
                      </div></td>
                    </tr>
                  ))}
                  {!promoCodes.length && <tr><td colSpan={7}><div className="emptyState"><div className="emptyTitle">No promo codes</div><div className="emptyText">Create codes like KDSL10 or NEWMEMBER</div></div></td></tr>}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Bundles ── */}
        {tab === 'bundles' && (
          <div className="adminCard">
            {loading ? <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Loading…</div> : (
              <table className="adminTable">
                <thead><tr><th>Title</th><th>Subtitle</th><th>Savings Label</th><th>Products</th><th>Active</th><th>Actions</th></tr></thead>
                <tbody>
                  {bundles.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700 }}>{b.title}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{b.subtitle}</td>
                      <td><span className="badge badgeActive">{b.savings_label}</span></td>
                      <td style={{ fontSize: 12 }}>{Array.isArray(b.product_ids) ? b.product_ids.length : 0} items</td>
                      <td><button className={`toggle ${b.is_active ? 'on' : ''}`} onClick={() => toggleActive('/api/admin/offers/bundles', b)} /></td>
                      <td><div style={{ display: 'flex', gap: 6 }}>
                        <button className="btnIcon" onClick={() => openModal('bundles', b)}><Edit2 size={13} /></button>
                        <button className="btnIcon" style={{ color: '#ef4444' }} onClick={() => deleteItem('/api/admin/offers/bundles', b.id)}><Trash2 size={13} /></button>
                      </div></td>
                    </tr>
                  ))}
                  {!bundles.length && <tr><td colSpan={6}><div className="emptyState"><div className="emptyTitle">No bundle deals</div></div></td></tr>}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal && (
        <div className="modalOverlay" onClick={() => setModal(null)}>
          <div className="modalBox" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <span className="modalTitle">{editing ? 'Edit' : 'Add'} {TABS.find((t) => t.id === modal)?.label.replace(/s$/, '')}</span>
              <button className="btnIcon" onClick={() => setModal(null)}><X size={16} /></button>
            </div>
            <div className="modalBody" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {err && <div className="adminAlert adminAlertError">{err}</div>}

              {modal === 'flash' && (
                <>
                  <div className="formGroup"><label className="formLabel">Title</label><input className="adminInput" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Flash Sale" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="formGroup"><label className="formLabel">Discount %</label><input className="adminInput" type="number" value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: parseInt(e.target.value) })} /></div>
                    <div className="formGroup"><label className="formLabel">Ends At</label><input className="adminInput" type="datetime-local" value={form.ends_at?.slice(0, 16) ?? ''} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
                  </div>
                  <div className="formGroup"><label className="formLabel">Countdown Label</label><input className="adminInput" value={form.countdown_label} onChange={(e) => setForm({ ...form, countdown_label: e.target.value })} placeholder="Sale Ends In" /></div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button className={`toggle ${form.is_active ? 'on' : ''}`} onClick={() => setForm({ ...form, is_active: !form.is_active })} /><span style={{ fontSize: 13 }}>Active</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button className={`toggle ${form.free_shipping_enabled ? 'on' : ''}`} onClick={() => setForm({ ...form, free_shipping_enabled: !form.free_shipping_enabled })} /><span style={{ fontSize: 13 }}>Free Shipping</span></div>
                  </div>
                </>
              )}

              {modal === 'promo' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="formGroup"><label className="formLabel">Code</label><input className="adminInput" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" /></div>
                    <div className="formGroup"><label className="formLabel">Label</label><input className="adminInput" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="20% Off" /></div>
                    <div className="formGroup"><label className="formLabel">Type</label><select className="adminSelect" style={{ width: '100%', height: 40 }} value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option><option value="free_shipping">Free Shipping</option></select></div>
                    <div className="formGroup"><label className="formLabel">Value</label><input className="adminInput" type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) })} /></div>
                    <div className="formGroup"><label className="formLabel">Min Order (LKR)</label><input className="adminInput" type="number" value={form.min_order ?? 0} onChange={(e) => setForm({ ...form, min_order: parseInt(e.target.value) })} /></div>
                  </div>
                  <div className="formGroup"><label className="formLabel">Description</label><input className="adminInput" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="On orders above LKR 5,000" /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button className={`toggle ${form.is_active ? 'on' : ''}`} onClick={() => setForm({ ...form, is_active: !form.is_active })} /><span style={{ fontSize: 13 }}>Active</span></div>
                </>
              )}

              {modal === 'bundles' && (
                <>
                  <div className="formGroup"><label className="formLabel">Title</label><input className="adminInput" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="The Essential Pack" /></div>
                  <div className="formGroup"><label className="formLabel">Subtitle</label><input className="adminInput" value={form.subtitle ?? ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Best together" /></div>
                  <div className="formGroup"><label className="formLabel">Product IDs (comma-separated)</label><input className="adminInput" value={Array.isArray(form.product_ids) ? form.product_ids.join(',') : ''} onChange={(e) => setForm({ ...form, product_ids: e.target.value.split(',').map((s: string) => s.trim()) })} placeholder="hoodie-001,tee-001" /></div>
                  <div className="formGroup"><label className="formLabel">Savings Label</label><input className="adminInput" value={form.savings_label ?? ''} onChange={(e) => setForm({ ...form, savings_label: e.target.value })} placeholder="Save LKR 2,000" /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button className={`toggle ${form.is_active ? 'on' : ''}`} onClick={() => setForm({ ...form, is_active: !form.is_active })} /><span style={{ fontSize: 13 }}>Active</span></div>
                </>
              )}
            </div>
            <div className="modalFooter">
              <button className="btnSecondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btnPrimary" disabled={saving} onClick={() => {
                const path = modal === 'flash' ? '/api/admin/offers/flash-sales' : modal === 'promo' ? '/api/admin/offers/promo-codes' : '/api/admin/offers/bundles';
                if (editing) save(path, 'PATCH', { id: editing.id, ...form });
                else save(path, 'POST', form);
              }}>
                {saving ? '…' : editing ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
