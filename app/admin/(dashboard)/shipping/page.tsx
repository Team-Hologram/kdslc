'use client';
import { useEffect, useState } from 'react';
import { Save, CheckCircle, AlertCircle, Truck } from 'lucide-react';

export default function AdminShipping() {
  const [settings, setSettings] = useState({ free_shipping_threshold: '7500', shipping_fee: '350', free_shipping_badge_text: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          free_shipping_threshold: data.free_shipping_threshold ?? '7500',
          shipping_fee: data.shipping_fee ?? '350',
          free_shipping_badge_text: data.free_shipping_badge_text ?? '',
        });
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setAlert(res.ok ? { type: 'success', msg: 'Shipping settings updated!' } : { type: 'error', msg: 'Error saving' });
    setTimeout(() => setAlert(null), 3000);
  };

  const threshold = parseInt(settings.free_shipping_threshold) || 7500;
  const fee = parseInt(settings.shipping_fee) || 350;

  return (
    <>
      <div className="adminHeader">
        <h1 className="adminHeaderTitle">
          <Truck size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: '#1ECFC8' }} />
          Shipping Settings
        </h1>
        <button className="btnPrimary" onClick={save} disabled={saving || loading}>
          {saving ? '…' : <><Save size={14} /> Save</>}
        </button>
      </div>

      <div className="adminContent">
        {alert && (
          <div className={`adminAlert ${alert.type === 'success' ? 'adminAlertSuccess' : 'adminAlertError'}`} style={{ marginBottom: 20 }}>
            {alert.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {alert.msg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Settings form */}
          <div className="adminCard">
            <div className="adminCardHeader"><span className="adminCardTitle">Shipping Configuration</span></div>
            <div className="adminCardBody" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="formGroup">
                <label className="formLabel">Free Shipping Threshold (LKR)</label>
                <span style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Orders above this amount get free shipping</span>
                <input className="adminInput" type="number" value={settings.free_shipping_threshold} onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })} />
              </div>
              <div className="formGroup">
                <label className="formLabel">Flat Shipping Fee (LKR)</label>
                <span style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Charged on orders below the threshold</span>
                <input className="adminInput" type="number" value={settings.shipping_fee} onChange={(e) => setSettings({ ...settings, shipping_fee: e.target.value })} />
              </div>
              <div className="formGroup">
                <label className="formLabel">Free Shipping Flash Badge Text</label>
                <span style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Shown in site header during flash sales. Leave empty to hide.</span>
                <input className="adminInput" value={settings.free_shipping_badge_text} onChange={(e) => setSettings({ ...settings, free_shipping_badge_text: e.target.value })} placeholder="Free shipping today" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="adminCard">
            <div className="adminCardHeader"><span className="adminCardTitle">Preview</span></div>
            <div className="adminCardBody" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Customer cart preview */}
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: '#64748b', fontSize: 11 }}>Cart Example</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Order value</span>
                  <span>LKR 6,000</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', marginBottom: 6 }}>
                  <span>Shipping</span>
                  <span>LKR {fee.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Add LKR {(threshold - 6000).toLocaleString()} more for free shipping
                </div>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: '#64748b', fontSize: 11 }}>Free Shipping Example</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Order value</span>
                  <span>LKR {(threshold + 500).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e' }}>
                  <span>Shipping</span>
                  <span>FREE 🎉</span>
                </div>
              </div>
              {settings.free_shipping_badge_text && (
                <div style={{ background: 'linear-gradient(135deg, #1ECFC8, #0ea5a0)', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: 'white', fontWeight: 700, textAlign: 'center' }}>
                  🚚 {settings.free_shipping_badge_text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
