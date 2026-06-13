import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession, getAdminFromRequest, okJson } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  let res = NextResponse.json({ success: true });
  return clearAdminSession(res);
}

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ admin: null }, { status: 401 });
  return okJson({ admin });
}
