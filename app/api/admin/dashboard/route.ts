import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { requireAdmin, errJson, okJson } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch {
    return errJson('Unauthorized', 401);
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // All queries in parallel
  const [
    { data: ordersAll },
    { data: ordersToday },
    { count: userCount },
    { count: newUserCount },
    { count: subscriberCount },
    { data: recentOrders },
    { data: statusBreakdown },
  ] = await Promise.all([
    supabase.from('orders').select('total, created_at, status'),
    supabase.from('orders').select('total').gte('created_at', today),
    supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
    supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).gte('subscribed_at', last7),
    supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('orders')
      .select('id, customer_name, customer_email, total, status, created_at, items')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('orders').select('status'),
  ]);

  // Revenue stats
  const totalRevenue = (ordersAll ?? []).reduce((s: number, o: any) => s + (o.total ?? 0), 0);
  const todayRevenue = (ordersToday ?? []).reduce((s: number, o: any) => s + (o.total ?? 0), 0);
  const totalOrders = (ordersAll ?? []).length;
  const pendingOrders = (ordersAll ?? []).filter((o: any) => o.status === 'pending').length;

  // Revenue chart: daily for last 30 days
  const revenueByDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    revenueByDay[key] = 0;
  }
  (ordersAll ?? [])
    .filter((o: any) => o.created_at >= last30)
    .forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (key in revenueByDay) revenueByDay[key] += o.total ?? 0;
    });
  const revenueChart = Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue }));

  // Order status counts
  const statusMap: Record<string, number> = {};
  (statusBreakdown ?? []).forEach((o: any) => {
    statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
  });
  const statusChart = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Top products (from order items JSON)
  const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  (ordersAll ?? []).forEach((order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item: any) => {
      const k = item.id || item.name;
      if (!productCounts[k]) productCounts[k] = { name: item.name ?? k, count: 0, revenue: 0 };
      productCounts[k].count += item.quantity ?? 1;
      productCounts[k].revenue += (item.price ?? 0) * (item.quantity ?? 1);
    });
  });
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, data]) => ({ id, ...data }));

  return okJson({
    stats: {
      totalRevenue,
      todayRevenue,
      totalOrders,
      pendingOrders,
      totalUsers: userCount ?? 0,
      newUsers7d: newUserCount ?? 0,
      subscribers: subscriberCount ?? 0,
    },
    revenueChart,
    statusChart,
    recentOrders: recentOrders ?? [],
    topProducts,
  });
}
