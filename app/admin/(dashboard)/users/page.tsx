'use client';
import { useEffect, useState } from 'react';
import { Search, Users, Mail, ShoppingBag } from 'lucide-react';

function fmtLKR(n: number) { return `LKR ${n.toLocaleString('en-LK')}`; }
function fmtDate(s: string) { return s ? new Date(s).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  return (
    <>
      <div className="adminHeader">
        <h1 className="adminHeaderTitle">Users <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>({users.length})</span></h1>
        <div className="adminHeaderActions">
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b' }}>
            <span><strong style={{ color: '#1e293b' }}>{users.filter((u) => u.confirmed).length}</strong> confirmed</span>
            <span><strong style={{ color: '#1e293b' }}>{users.filter((u) => u.orders > 0).length}</strong> with orders</span>
          </div>
        </div>
      </div>

      <div className="adminContent">
        <div className="adminSearch" style={{ marginBottom: 16, width: 'fit-content' }}>
          <Search size={15} />
          <input placeholder="Search by email or name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="adminCard">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading users…</div>
          ) : (
            <table className="adminTable">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Joined</th>
                  <th>Last Sign In</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', background: '#1ECFC820',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800, color: '#0ea5a0', flexShrink: 0,
                        }}>
                          {u.name?.charAt(0).toUpperCase() ?? u.email?.charAt(0).toUpperCase() ?? 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name || '—'}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(u.created_at)}</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(u.last_sign_in)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}>
                        <ShoppingBag size={13} style={{ color: '#94a3b8' }} />
                        {u.orders}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{u.total_spent > 0 ? fmtLKR(u.total_spent) : '—'}</td>
                    <td>
                      <span className={`badge ${u.confirmed ? 'badgeActive' : 'badgeDraft'}`}>
                        {u.confirmed ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr><td colSpan={6}>
                    <div className="emptyState">
                      <div className="emptyIcon"><Users size={24} /></div>
                      <div className="emptyTitle">No users found</div>
                      <div className="emptyText">Users will appear here when people sign up</div>
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
