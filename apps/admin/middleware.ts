import { protectRoute } from '@villa-platform/middleware';
import { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  return protectRoute(req);
}

export const config = {
  // Protect all routes except _next, public files, and api
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
