import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

// Routes that require a logged-in user (any role)
const STUDENT_ROUTES = ['/dashboard', '/payment', '/watch', '/downloads'];
// Admin-only routes
const ADMIN_ROUTES = ['/admin'];
// Routes accessible only to unauthenticated users (redirect logged-in users away)
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret });

  // --- Redirect logged-in users away from auth pages ---
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    if (token) {
      if (token.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // --- Admin routes: must be authenticated + role === admin ---
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));
    if (token.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', req.url));
    return NextResponse.next();
  }

  // --- Student-protected routes ---
  if (STUDENT_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));

    if (token.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    const { status, accessExpiresAt } = token;

    // Expired or revoked — hard block
    if (status === 'expired' || status === 'revoked') {
      return NextResponse.redirect(new URL('/access-ended', req.url));
    }

    // Rejected — must resubmit payment
    if (status === 'rejected') {
      if (!pathname.startsWith('/payment')) {
        return NextResponse.redirect(new URL('/payment', req.url));
      }
      return NextResponse.next();
    }

    // Pending — only allowed on /payment or /payment/pending
    if (status === 'pending') {
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/watch')) {
        return NextResponse.redirect(new URL('/payment', req.url));
      }
      return NextResponse.next();
    }

    // Paid — check expiry
    if (status === 'paid') {
      if (accessExpiresAt && new Date(accessExpiresAt) < new Date()) {
        // Token says paid but access has expired — redirect to access-ended
        return NextResponse.redirect(new URL('/access-ended', req.url));
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/payment/:path*',
    '/watch/:path*',
    '/downloads/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password/:path*',
  ],
};
