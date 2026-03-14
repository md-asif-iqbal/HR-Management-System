import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // HR routes protection — only HR users can access /hr/*
    if (pathname.startsWith('/hr') && token?.role !== 'hr') {
      return NextResponse.redirect(new URL('/employee/dashboard', req.url));
    }

    // Employee routes protection — HR users should go to /hr/dashboard
    if (pathname.startsWith('/employee') && token?.role === 'hr') {
      return NextResponse.redirect(new URL('/hr/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/employee/:path*',
    '/hr/:path*',
  ],
};
