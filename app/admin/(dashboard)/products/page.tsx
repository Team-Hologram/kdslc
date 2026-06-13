'use client';
import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { notifyDataChanged } from '@/lib/client-data-events';

const CATEGORIES = ['Hoodies', 'T-Shirts', 'Sets', 'Jackets', 'Accessories'];

function fmtLKR(n: number) { return `LKR ${n.toLocaleString('en-LK')}`; }
function salePrice(price: number, percent: number) { return Math.round(price * (1 - percent / 100)); }
function colorsToFormValue(colors: any) {
  return Array.isArray(colors)
    ? colors
        .map((color) => color?.name && color?.hex ? `${color.name}:${color.hex}` : '')
        .filter(Boolean)
        .join(', ')
    : '';
}
function parseColors(value: string) {
  return value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, ...hexParts] = entry.split(':');
      const rawHex = hexParts.join(':').trim();
      const hex = rawHex.startsWith('#') ? rawHex : `#${rawHex}`;
      return { name: name.trim(), hex };
    })
    .filter((color) => color.name && /^#[0-9a-fA-F]{3,8}$/.test(color.hex));
}

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Hoodies',
    price: '',
    description: '',
    sizes: 'XS,S,M,L,XL',
    colors: 'Black:#111111, White:#FFFFFF',
    tag: '',
    is_active: true,
    is_featured: false,
    is_on_sale: false,
    sale_percent: '15',
  });
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [heroImage, setHeroImage] = useState('');
  const [newHeroImage, setNewHeroImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, category]);

  const openAdd = () => {
    setForm({ name: '', category: 'Hoodies', price: '', description: '', sizes: 'XS,S,M,L,XL', colors: 'Black:#111111, White:#FFFFFF', tag: '', is_active: true, is_featured: false, is_on_sale: false, sale_percent: '15' });
    setExistingImages([]);
    setNewImages([]);
    setHeroImage('');
    setNewHeroImage(null);
    setEditing(null);
    setErr('');
    setModal('add');
  };

  const openEdit = (p: any) => {
    setForm({
      name: p.name, category: p.category, price: String(p.price),
      description: p.description ?? '',
      sizes: Array.isArray(p.sizes) ? p.sizes.join(',') : p.sizes,
      colors: colorsToFormValue(p.colors),
      tag: p.tag ?? '',
      is_active: p.is_active,
      is_featured: Boolean(p.is_featured),
      is_on_sale: Boolean(p.is_on_sale),
      sale_percent: p.sale_percent ? String(p.sale_percent) : '15',
    });
    setExistingImages(Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []));
    setNewImages([]);
    setHeroImage(p.hero_image ?? '');
    setNewHeroImage(null);
    setEditing(p);
    setErr('');
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('category', form.category);
      formData.append('price', form.price);
      formData.append('description', form.description);
      formData.append('tag', form.tag);
      formData.append('sizes', JSON.stringify(form.sizes.split(',').map((s) => s.trim())));
      formData.append('colors', JSON.stringify(parseColors(form.colors)));
      formData.append('is_active', String(form.is_active));
      formData.append('is_featured', String(form.is_featured));
      formData.append('is_on_sale', String(form.is_on_sale));
      formData.append('sale_percent', form.sale_percent);

      formData.append('existing_images', JSON.stringify(existingImages));
      formData.append('existing_hero_image', heroImage);
      if (newHeroImage) formData.append('hero_image', newHeroImage);
      newImages.forEach((file) => {
        formData.append('images', file);
      });

      let res;
      if (modal === 'add') {
        res = await fetch('/api/admin/products', { method: 'POST', body: formData });
      } else {
        res = await fetch(`/api/admin/products/${editing.id}`, { method: 'PUT', body: formData });
      }
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || 'Server returned an invalid response' };
      }
      if (!res.ok) {
        setErr(data.error ?? `Error saving product (${res.status})`);
        return;
      }
      setModal(null);
      notifyDataChanged();
      load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Network error while saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    notifyDataChanged();
    load();
  };

  return (
    <>
      <div className="adminHeader">
        <h1 className="adminHeaderTitle">Products <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>({products.length})</span></h1>
        <div className="adminHeaderActions">
          <button className="btnSecondary" onClick={load}><RefreshCw size={14} /></button>
          <button className="btnPrimary" onClick={openAdd}><Plus size={14} /> Add Product</button>
        </div>
      </div>

      <div className="adminContent">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div className="adminSearch">
            <Search size={15} />
            <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="adminSelect" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="adminCard">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading products…</div>
          ) : (
            <table className="adminTable">
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Featured</th><th>Sale</th><th>Tag</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {p.image && <img src={p.image} alt={p.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{p.category}</td>
                    <td style={{ fontWeight: 700 }}>
                      {p.is_on_sale && p.sale_percent ? (
                        <div>
                          <div>{fmtLKR(salePrice(p.price, p.sale_percent))}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>{fmtLKR(p.price)}</div>
                        </div>
                      ) : fmtLKR(p.price)}
                    </td>
                    <td>
                      {p.is_featured
                        ? <span className="badge badgeActive">Featured</span>
                        : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td>
                      {p.is_on_sale && p.sale_percent
                        ? <span className="badge badgeActive">-{p.sale_percent}%</span>
                        : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td>{p.tag ? <span className="badge badgeActive">{p.tag}</span> : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td><span className={`badge ${p.is_active ? 'badgeActive' : 'badgeInactive'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btnIcon" onClick={() => openEdit(p)}><Edit2 size={13} /></button>
                        <button className="btnIcon" onClick={() => handleDelete(p.id)} style={{ color: '#ef4444', borderColor: '#fecaca' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!products.length && (
                  <tr><td colSpan={8}>
                    <div className="emptyState">
                      <div className="emptyTitle">No products found</div>
                      <div className="emptyText">Run the admin migration SQL in Supabase to seed products.</div>
                      <button className="btnPrimary" onClick={openAdd}><Plus size={14} /> Add First Product</button>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modalOverlay" onClick={() => setModal(null)}>
          <div className="modalBox" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <span className="modalTitle">{modal === 'add' ? 'Add Product' : `Edit: ${editing?.name}`}</span>
              <button className="btnIcon" onClick={() => setModal(null)}><X size={16} /></button>
            </div>
            <div className="modalBody" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {err && <div className="adminAlert adminAlertError">{err}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="formGroup" style={{ gridColumn: '1 / -1' }}>
                  <label className="formLabel">Product Name *</label>
                  <input className="adminInput" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Signature Oversized Hoodie" />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Category *</label>
                  <select className="adminSelect" style={{ width: '100%', height: 40 }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="formGroup">
                  <label className="formLabel">Price (LKR) *</label>
                  <input className="adminInput" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="8500" />
                </div>
                <div className="formGroup" style={{ gridColumn: '1 / -1', padding: 14, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <label className="formLabel" style={{ marginBottom: 2 }}>Featured Section</label>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Show this product in the home Featured Pieces carousel.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button type="button" className={`toggle ${form.is_featured ? 'on' : ''}`} onClick={() => setForm({ ...form, is_featured: !form.is_featured })} />
                      <span style={{ fontSize: 13, color: '#64748b' }}>{form.is_featured ? 'Selected' : 'Not selected'}</span>
                    </div>
                  </div>
                </div>
                <div className="formGroup" style={{ gridColumn: '1 / -1', padding: 14, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: form.is_on_sale ? 12 : 0 }}>
                    <div>
                      <label className="formLabel" style={{ marginBottom: 2 }}>Sale / Offer</label>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Show this product in the On Sale Now section.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button type="button" className={`toggle ${form.is_on_sale ? 'on' : ''}`} onClick={() => setForm({ ...form, is_on_sale: !form.is_on_sale })} />
                      <span style={{ fontSize: 13, color: '#64748b' }}>{form.is_on_sale ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                  {form.is_on_sale && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="formGroup">
                        <label className="formLabel">Discount Percent *</label>
                        <input
                          className="adminInput"
                          type="number"
                          min="1"
                          max="100"
                          value={form.sale_percent}
                          onChange={(e) => setForm({ ...form, sale_percent: e.target.value })}
                          placeholder="20"
                        />
                      </div>
                      <div className="formGroup">
                        <label className="formLabel">Sale Price Preview</label>
                        <div className="adminInput" style={{ display: 'flex', alignItems: 'center', background: '#fff', color: '#0f172a', fontWeight: 700 }}>
                          {form.price && form.sale_percent
                            ? fmtLKR(salePrice(parseInt(form.price, 10), parseInt(form.sale_percent, 10)))
                            : 'Enter price and discount'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="formGroup" style={{ gridColumn: '1 / -1' }}>
                  <label className="formLabel">Hero Image (optional)</label>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                    Used only in the home hero section. Recommended: 1920×1080 or 2400×1350 wide image.
                  </div>
                  {(newHeroImage || heroImage) ? (
                    <div style={{ position: 'relative', width: '100%', maxWidth: 360, aspectRatio: '16 / 9', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <img
                        src={newHeroImage ? URL.createObjectURL(newHeroImage) : heroImage}
                        alt="Hero preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => { setHeroImage(''); setNewHeroImage(null); }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        aria-label="Remove hero image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label style={{ width: '100%', maxWidth: 360, aspectRatio: '16 / 9', borderRadius: 8, border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', background: '#f8fafc' }}>
                      <Plus size={24} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Upload hero image</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setNewHeroImage(file);
                        }}
                      />
                    </label>
                  )}
                </div>
                <div className="formGroup" style={{ gridColumn: '1 / -1' }}>
                  <label className="formLabel">Images (Max 3)</label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    {existingImages.map((url, i) => (
                      <div key={`ext-${i}`} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <img src={url} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', padding: 2, cursor: 'pointer' }}><X size={12} /></button>
                      </div>
                    ))}
                    {newImages.map((file, i) => (
                      <div key={`new-${i}`} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <img src={URL.createObjectURL(file)} alt={`new-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => setNewImages(newImages.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', padding: 2, cursor: 'pointer' }}><X size={12} /></button>
                      </div>
                    ))}
                    {(existingImages.length + newImages.length) < 3 && (
                      <label style={{ width: 80, height: 80, borderRadius: 8, border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                        <Plus size={24} />
                        <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                          if (e.target.files) {
                            const files = Array.from(e.target.files);
                            const allowed = 3 - (existingImages.length + newImages.length);
                            if (allowed > 0) setNewImages([...newImages, ...files.slice(0, allowed)]);
                          }
                        }} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="formGroup">
                  <label className="formLabel">Sizes (comma-separated)</label>
                  <input className="adminInput" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="XS,S,M,L,XL" />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Colors</label>
                  <input
                    className="adminInput"
                    value={form.colors}
                    onChange={(e) => setForm({ ...form, colors: e.target.value })}
                    placeholder="Black:#111111, White:#FFFFFF"
                  />
                  <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Format: Name:#HEX, Name:#HEX
                  </span>
                </div>
                <div className="formGroup">
                  <label className="formLabel">Tag (optional)</label>
                  <input className="adminInput" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="BEST SELLER" />
                </div>
                <div className="formGroup" style={{ gridColumn: '1 / -1' }}>
                  <label className="formLabel">Description</label>
                  <textarea className="adminTextarea" style={{ minHeight: 80 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product description…" />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Status</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className={`toggle ${form.is_active ? 'on' : ''}`} onClick={() => setForm({ ...form, is_active: !form.is_active })} />
                    <span style={{ fontSize: 13, color: '#64748b' }}>{form.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modalFooter">
              <button className="btnSecondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btnPrimary" onClick={handleSave} disabled={saving}>
                {saving ? '…' : modal === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
