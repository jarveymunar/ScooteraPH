import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Always initialize default next response
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const pathname = request.nextUrl.pathname;

    // Fast-path bypass for static files, Next internals, icons, images, and API routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/assets') ||
      pathname.startsWith('/public') ||
      pathname === '/favicon.ico' ||
      pathname.includes('.')
    ) {
      return supabaseResponse;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    // If Supabase environment variables are missing or invalid, bypass middleware gracefully
    if (!supabaseUrl || !supabaseAnonKey) {
      return supabaseResponse;
    }

    // Validate URL format before creating client to prevent URL parse exceptions
    try {
      const parsedUrl = new URL(supabaseUrl);
      if (!parsedUrl.protocol.startsWith('http')) {
        return supabaseResponse;
      }
    } catch {
      return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          try {
            return request.cookies.getAll();
          } catch {
            return [];
          }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          } catch (cookieErr) {
            console.warn('[Middleware Cookie Error]', cookieErr);
          }
        },
      },
    });

    // Safely verify user without throwing unhandled exceptions
    let user = null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data && data.user) {
        user = data.user;
      }
    } catch (authErr) {
      console.warn('[Middleware Auth Warning]', authErr);
      user = null;
    }

    // Role-based route protection for designated server subroutes
    if (user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (!profile.is_active) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('error', 'deactivated');
            return NextResponse.redirect(url);
          }

          const role = profile.role;
          if (pathname.startsWith('/owner') && role !== 'owner') {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
          }

          if (pathname.startsWith('/admin') && role !== 'admin' && role !== 'owner') {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
          }
        }
      } catch (profileErr) {
        console.warn('[Middleware Profile Check Error]', profileErr);
      }
    }

    return supabaseResponse;
  } catch (fatalMiddlewareErr) {
    // Top-level fallback ensures Vercel Edge never returns 500 MIDDLEWARE_INVOCATION_FAILED
    console.error('[Middleware Invocation Fallback]', fatalMiddlewareErr);
    return supabaseResponse;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/assets with extensions (.png, .jpg, .svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
