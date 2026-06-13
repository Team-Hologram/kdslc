'use client';
import { useEffect, useState } from 'react';
import { Save, CheckCircle, AlertCircle, Shield, QrCode } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);
  // 2FA state
  const [qrData, setQrData] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [tfaCode, setTfaCode] = useState('');
  const [tfaSaving, setTfaSaving] = useState(false);
  const [tfaAlert, setTfaAlert] = useState<{ type: string; msg: string } | null>(null);
  const [adminInfo, setAdminInfo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/settings').then((r) => r.json()).then(setSettings).finally(() => setLoading(false));
    fetch('/api/admin/auth/logout', { method: 'GET' }).then((r) => r.json()).then((d) => setAdminInfo(d.admin));
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setAlert(res.ok ? { type: 'success', msg: 'Settings saved successfully!' } : { type: 'error', msg: 'Error saving settings' });
    setTimeout(() => setAlert(null), 3000);
  };

  const setup2FA = async () => {
    setTfaSaving(true);
    const res = await fetch('/api/admin/auth/2fa-setup');
    const data = await res.json();
    setQrData(data);
    setTfaSaving(false);
  };

  const verify2FA = async () => {
    if (tfaCode.length !== 6) return;
    setTfaSaving(true);
    const res = await fetch('/api/admin/auth/2fa-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: tfaCode }),
    });
    const data = await res.json();
    setTfaSaving(false);
    if (res.ok) {
      setTfaAlert({ type: 'success', msg: '2FA enabled successfully! It will be required on next login.' });
      setQrData(null);
      setTfaCode('');
    } else {
      setTfaAlert({ type: 'error', msg: data.error ?? 'Invalid code' });
    }
    setTimeout(() => setTfaAlert(null), 5000);
  };

  const SETTING_LABELS: Record<string, { label: string; desc: string; type?: string }> = {
    free_shipping_threshold: { label: 'Free Shipping Threshold (LKR)', desc: 'Orders above this amount get free shipping', type: 'number' },
    shipping_fee: { label: 'Flat Shipping Fee (LKR)', desc: 'Fee charged for orders below the threshold', type: 'number' },
    free_shipping_badge_text: { label: 'Free Shipping Badge Text', desc: 'Shown in the site header. Leave empty to hide.' },
  };

  return (
    <>
      <div className="adminHeader">
        <h1 className="adminHeaderTitle">Settings</h1>
        <button className="btnPrimary" onClick={save} disabled={saving}>
          {saving ? '…' : <><Save size={14} /> Save All</>}
        </button>
      </div>

      <div className="adminContent">
        {alert && (
          <div className={`adminAlert ${alert.type === 'success' ? 'adminAlertSuccess' : 'adminAlertError'}`} style={{ marginBottom: 20 }}>
            {alert.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {alert.msg}
          </div>
        )}

        {/* Site Settings */}
        <div className="adminCard" style={{ marginBottom: 20 }}>
          <div className="adminCardHeader"><span className="adminCardTitle">Site Settings</span></div>
          <div className="adminCardBody" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {loading ? (
              [1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 48 }} />)
            ) : (
              Object.entries(settings).map(([key, value]) => {
                const meta = SETTING_LABELS[key];
                return (
                  <div key={key} className="formGroup">
                    <label className="formLabel">{meta?.label ?? key}</label>
                    {meta?.desc && <span style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{meta.desc}</span>}
                    <input
                      className="adminInput"
                      type={meta?.type ?? 'text'}
                      value={value}
                      onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2FA Security */}
        <div className="adminCard">
          <div className="adminCardHeader">
            <span className="adminCardTitle">
              <Shield size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Two-Factor Authentication
            </span>
          </div>
          <div className="adminCardBody">
            {tfaAlert && (
              <div className={`adminAlert ${tfaAlert.type === 'success' ? 'adminAlertSuccess' : 'adminAlertError'}`} style={{ marginBottom: 20 }}>
                {tfaAlert.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {tfaAlert.msg}
              </div>
            )}

            {!qrData ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Enhance account security</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    Enable TOTP-based 2FA to require a 6-digit code (Google Authenticator, Authy) on every login.
                  </div>
                </div>
                <button className="btnPrimary" onClick={setup2FA} disabled={tfaSaving}>
                  {tfaSaving ? '…' : <><QrCode size={14} /> Setup 2FA</>}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>1. Scan this QR code</div>
                  <img src={qrData.qrDataUrl} alt="2FA QR Code" style={{ width: 180, height: 180, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
                    Manual key: <code style={{ fontSize: 10, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{qrData.secret}</code>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>2. Enter verification code</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                    Open Google Authenticator or Authy, scan the QR code, then enter the 6-digit code.
                  </div>
                  <div className="formGroup">
                    <label className="formLabel">Verification Code</label>
                    <input
                      className="adminInput"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={tfaCode}
                      onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, ''))}
                      style={{ fontSize: 20, letterSpacing: '0.2em', textAlign: 'center', width: 160 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button className="btnPrimary" onClick={verify2FA} disabled={tfaSaving || tfaCode.length !== 6}>
                      {tfaSaving ? '…' : <><Shield size={14} /> Enable 2FA</>}
                    </button>
                    <button className="btnSecondary" onClick={() => setQrData(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
