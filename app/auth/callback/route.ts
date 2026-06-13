import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // OAuth/PKCE flow sends `code`
  const code = searchParams.get('code');
  // Email confirmation flow sends `token_hash` + `type`
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as
    | 'signup'
    | 'recovery'
    | 'invite'
    | 'email'
    | null;
  const next = searchParams.get('next') ?? '/';

  const redirectUrl =
    process.env.NODE_ENV === 'development'
      ? `${origin}${next}`
      : `https://${request.headers.get('x-forwarded-host') ?? new URL(origin).host}${next}`;

  // Build the redirect response FIRST so we can attach cookies to it
  const supabaseResponse = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write every session cookie onto the redirect response
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // ── Email confirmation (verify email after signup) ──
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) return supabaseResponse; // Session cookies are now set → user is logged in
  }

  // ── OAuth code exchange (Google, etc.) ──
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return supabaseResponse;
  }

  // Auth failed
  return NextResponse.redirect(`${origin}/auth/login?error=auth_error`);
}
