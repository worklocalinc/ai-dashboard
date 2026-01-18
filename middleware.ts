import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard') ||
                        req.nextUrl.pathname.startsWith('/models') ||
                        req.nextUrl.pathname.startsWith('/keys') ||
                        req.nextUrl.pathname.startsWith('/usage') ||
                        req.nextUrl.pathname.startsWith('/arena') ||
                        req.nextUrl.pathname.startsWith('/admin');
  const isOnAuth = req.nextUrl.pathname.startsWith('/login') ||
                   req.nextUrl.pathname.startsWith('/pending');
  const isOnApi = req.nextUrl.pathname.startsWith('/api');
  const isOnHome = req.nextUrl.pathname === '/';

  // Allow API routes
  if (isOnApi) {
    return NextResponse.next();
  }

  // Redirect logged-in users from auth pages
  if (isLoggedIn && isOnAuth) {
    const role = req.auth?.user?.role;
    if (role === 'pending') {
      return NextResponse.redirect(new URL('/pending', req.nextUrl));
    }
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  // Require authentication for dashboard
  if (!isLoggedIn && isOnDashboard) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Check pending status for dashboard access
  if (isLoggedIn && isOnDashboard) {
    const role = req.auth?.user?.role;
    if (role === 'pending' && !req.nextUrl.pathname.startsWith('/pending')) {
      return NextResponse.redirect(new URL('/pending', req.nextUrl));
    }
  }

  // Check admin access
  if (isLoggedIn && req.nextUrl.pathname.startsWith('/admin')) {
    const role = req.auth?.user?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.nextUrl));
    }
  }

  // Redirect home to dashboard for logged-in users
  if (isLoggedIn && isOnHome) {
    const role = req.auth?.user?.role;
    if (role === 'pending') {
      return NextResponse.redirect(new URL('/pending', req.nextUrl));
    }
    return NextResponse.redirect(new URL('/models', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
};
