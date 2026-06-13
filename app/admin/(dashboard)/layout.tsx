import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import AdminSidebar from './AdminSidebar';
import '../admin.css';

export const metadata: Metadata = {
  title: 'KDSL Admin Panel',
  robots: 'noindex, nofollow',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminSession();

  return (
    <div className="adminShell">
      <AdminSidebar admin={admin} />
      <div className="adminMain">
        {children}
      </div>
    </div>
  );
}
