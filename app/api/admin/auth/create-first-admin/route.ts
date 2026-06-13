import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { errJson, okJson } from '@/lib/admin-auth';

// Bootstrap: create the very first admin user (only works if no admins exist)
export async function POST(req: NextRequest) {
  const supabase = createAdminSupabaseClient();

  // Check no admin users exist
  const { count } = await supabase
    .from('admin_users')
    .select('*', { count: 'exact', head: true });

  if ((count ?? 0) > 0) {
    return errJson('Admin user already exists. Use the login page.', 403);
  }

  const { email, password, name } = await req.json();
  if (!email || !password || !name) return errJson('email, password and name required');
  if (password.length < 8) return errJson('Password must be at least 8 characters');

  const password_hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from('admin_users')
    .insert({ email: email.toLowerCase().trim(), password_hash, name, role: 'super_admin' })
    .select('id, email, name, role')
    .single();

  if (error) return errJson(error.message, 500);

  return okJson({ success: true, admin: data }, 201);
}
