'use client';
import { useEffect, useState } from 'react';
import { Mail, Send, Plus, X, Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminEmails() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/emails');
    const data = await res.json();
    setCampaigns(data.campaigns ?? []);
    setSubscriberCount(data.subscriberCount ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveDraft = async () => {
    if (!form.subject || !form.body) { setAlert({ type: 'error', msg: 'Subject and body required' }); return; }
    setSaving(true);
    const res = await fetch('/api/admin/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setAlert({ type: 'success', msg: 'Draft saved' });
      setForm({ subject: '', body: '' });
      setShowCompose(false);
      load();
    } else {
      setAlert({ type: 'error', msg: 'Error saving' });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const sendCampaign = async (id: string) => {
    if (!confirm(`Send this campaign to ${subscriberCount} subscribers?`)) return;
    setSending(id);
    const res = await fetch('/api/admin/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: id }),
    });
    const data = await res.json();
    setSending(null);
    if (res.ok) {
      setAlert({ type: 'success', msg: `Sent to ${data.sentCount} subscribers!` });
      load();
    } else {
      setAlert({ type: 'error', msg: data.error ?? 'Send failed' });
    }
    setTimeout(() => setAlert(null), 5000);
  };

  function fmtDate(s: string) { return s ? new Date(s).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

  return (
    <>
      <div className="adminHeader">
        <h1 className="adminHeaderTitle">Email Campaigns</h1>
        <div className="adminHeaderActions">
          <div style={{ display: 'flex', gap: 6, fontSize: 13, color: '#64748b', alignItems: 'center' }}>
            <Users size={14} />
            <strong style={{ color: '#1e293b' }}>{subscriberCount}</strong> subscribers
          </div>
          <button className="btnPrimary" onClick={() => setShowCompose(!showCompose)}>
            <Plus size={14} /> Compose
          </button>
        </div>
      </div>

      <div className="adminContent">
        {alert && (
          <div className={`adminAlert ${alert.type === 'success' ? 'adminAlertSuccess' : 'adminAlertError'}`} style={{ marginBottom: 16 }}>
            {alert.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {alert.msg}
          </div>
        )}

        {/* Compose panel */}
        {showCompose && (
          <div className="adminCard" style={{ marginBottom: 20 }}>
            <div className="adminCardHeader">
              <span className="adminCardTitle">New Campaign</span>
              <button className="btnIcon" onClick={() => setShowCompose(false)}><X size={14} /></button>
            </div>
            <div className="adminCardBody" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="formGroup">
                <label className="formLabel">Subject Line</label>
                <input className="adminInput" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Your exclusive offer from KDSL Clothing…" />
              </div>
              <div className="formGroup">
                <label className="formLabel">Email Body (HTML supported)</label>
                <textarea className="adminTextarea" style={{ minHeight: 240 }} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder={`<h2>Exclusive offer just for you!</h2>\n<p>Shop our latest collection with <strong>20% off</strong>…</p>\n<a href="https://yoursite.com">Shop Now</a>`}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Will be sent to {subscriberCount} active subscribers</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btnSecondary" onClick={() => setShowCompose(false)}>Cancel</button>
                  <button className="btnSecondary" onClick={saveDraft} disabled={saving}>Save Draft</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns list */}
        <div className="adminCard">
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading campaigns…</div> : (
            <table className="adminTable">
              <thead><tr><th>Subject</th><th>Status</th><th>Created</th><th>Sent At</th><th>Recipients</th><th>Actions</th></tr></thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.subject}</td>
                    <td><span className={`badge ${c.status === 'sent' ? 'badgeSent' : 'badgeDraft'}`}>{c.status}</span></td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(c.created_at)}</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(c.sent_at)}</td>
                    <td style={{ fontWeight: 700 }}>{c.sent_count > 0 ? c.sent_count : '—'}</td>
                    <td>
                      {c.status === 'draft' ? (
                        <button
                          className="btnPrimary"
                          style={{ padding: '6px 14px', fontSize: 12 }}
                          onClick={() => sendCampaign(c.id)}
                          disabled={sending === c.id}
                        >
                          {sending === c.id ? '…' : <><Send size={12} /> Send</>}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>✓ Delivered</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!campaigns.length && (
                  <tr><td colSpan={6}>
                    <div className="emptyState">
                      <div className="emptyIcon"><Mail size={24} /></div>
                      <div className="emptyTitle">No campaigns yet</div>
                      <div className="emptyText">Compose your first email campaign to your subscribers</div>
                      <button className="btnPrimary" onClick={() => setShowCompose(true)}><Plus size={14} /> Compose</button>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
