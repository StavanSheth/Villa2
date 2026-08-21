import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL('/reports', request.url));
  
  response.cookies.set({
    name: 'access_token',
    value: 'demo-admin-jwt',
    httpOnly: false,
    path: '/',
    sameSite: 'lax',
  });
  
  return response;
}
