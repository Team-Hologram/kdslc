import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET — fetch user's watchlist
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ items: [] });

    const { data, error } = await supabase
      .from('watchlist_items')
      .select('*, products(*)')
      .eq('user_id', user.id)
      .order('created_at');

    if (error) throw error;
    return NextResponse.json({ items: data });
  } catch (err) {
    console.error('Watchlist GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

// POST — add product to watchlist
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { product_id } = await request.json();

    const { data, error } = await supabase
      .from('watchlist_items')
      .upsert({ user_id: user.id, product_id }, { onConflict: 'user_id,product_id' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (err) {
    console.error('Watchlist POST error:', err);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}

// DELETE — remove product from watchlist
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { product_id } = await request.json();

    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', product_id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Watchlist DELETE error:', err);
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}
