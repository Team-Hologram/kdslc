'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Package, Users, Tag,
  Truck, Mail, Settings, LogOut, Menu, X, ChevronRight,
  Bell
} from 'lucide-react';

interface AdminPayload {
  name: string;
  email: string;
  role: string;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/offers', label: 'Offers', icon: Tag },
  { href: '/admin/shipping', label: 'Shipping', icon: Truck },
  { href: '/admin/emails', label: 'Email Campaigns', icon: Mail },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar({ admin }: { admin: AdminPayload | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const initials = admin?.name
    ? admin.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="adminSidebarLogo">
        <div className="adminLogoText">KDSL</div>
        <div className="adminLogoSub">Admin Panel</div>
      </div>

      {/* Nav */}
      <nav className="adminNav">
        <div className="adminNavLabel">Main Menu</div>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`adminNavLink ${isActive(item.href, item.exact) ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon size={17} />
            {item.label}
            {isActive(item.href, item.exact) && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="adminSidebarFooter">
        {admin && (
          <div className="adminUserInfo">
            <div className="adminUserAvatar">{initials}</div>
            <div>
              <div className="adminUserName">{admin.name}</div>
              <div className="adminUserRole">{admin.role.replace('_', ' ')}</div>
            </div>
          </div>
        )}
        <button className="adminNavLink" onClick={handleLogout} style={{ color: 'rgba(239,68,68,0.8)' }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        style={{
          position: 'fixed', top: 12, left: 16, zIndex: 200,
          background: '#0f172a', border: 'none', borderRadius: 10,
          width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
          color: 'white', cursor: 'pointer',
        }}
        className="mobileSidebarToggle"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop sidebar */}
      <aside className={`adminSidebar ${mobileOpen ? 'open' : ''}`}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
