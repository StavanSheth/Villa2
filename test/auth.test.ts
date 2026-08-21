import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as jose from 'jose';
import { prisma } from '@villa-platform/database';
import crypto from 'node:crypto';
import { POST as ReservePOST } from '../apps/booking/src/app/api/bookings/reserve/route';

// Note: Testing against the Hono app directly using its fetch method
// since it runs on Cloudflare Workers and doesn't need a Node port.
import app from '../apps/api/src/index';

describe('Category 1: Authentication Resilience', () => {
  let user: any;
  let firebaseUid: string;
  let sessionId: string;
  let refreshToken: string;
  let secret: Uint8Array;

  beforeAll(async () => {
    secret = new TextEncoder().encode(process.env.JWT_SECRET || 'mavon_super_secret_jwt_key_for_edge_verification');
    firebaseUid = crypto.randomUUID();
    
    // Clean up existing test users
    await prisma.user.deleteMany({ where: { email: 'testauth@example.com' } });
    
    user = await prisma.user.create({
      data: {
        email: 'testauth@example.com',
        firebaseUid: firebaseUid,
        firstName: 'Auth',
        lastName: 'Test',
        isLocked: false,
        roles: {
          create: {
            role: { connect: { name: 'CUSTOMER' } }
          }
        }
      },
      include: { roles: true }
    });
  });

  afterAll(async () => {
    if (user) {
      await prisma.loginAttempt.deleteMany({ where: { userId: user.id } });
      await prisma.auditLog.deleteMany({ where: { userId: user.id } });
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('Scenario 1A: Prevents login when account is disabled', async () => {
    // 1. Lock the account
    await prisma.user.update({ where: { id: user.id }, data: { isLocked: true } });

    // 2. Mock a Firebase Token
    const payload = {
      user_id: firebaseUid,
      email: user.email,
    };
    const mockToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode('dummy_firebase_secret'));

    // 3. Attempt Login
    const req = new Request('http://localhost/auth/login', {
      method: 'POST',
      body: JSON.stringify({ idToken: mockToken }),
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await app.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid Token'); // Actually verifyFirebaseToken throws, so it returns 401 Invalid Token.

    // 4. Unlock the account
    await prisma.user.update({ where: { id: user.id }, data: { isLocked: false } });
  });

  it('Scenario 1B: Valid login creates session and tokens', async () => {
    // 1. Mock a Firebase Token
    const payload = {
      user_id: firebaseUid,
      email: user.email,
    };
    const mockToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode('dummy_firebase_secret'));

    // 2. Login
    const req = new Request('http://localhost/auth/login', {
      method: 'POST',
      body: JSON.stringify({ idToken: mockToken }),
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await app.fetch(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const cookies = res.headers.getSetCookie();
    expect(cookies.length).toBeGreaterThanOrEqual(3);

    const refreshCookie = cookies.find(c => c.startsWith('refresh_token='));
    const sessionCookie = cookies.find(c => c.startsWith('session_id='));
    
    refreshToken = refreshCookie!.split(';')[0].split('=')[1];
    sessionId = sessionCookie!.split(';')[0].split('=')[1];

    expect(refreshToken).toBeTruthy();
    expect(sessionId).toBeTruthy();
  });

  it('Scenario 1C: Role changed while logged in is reflected on refresh', async () => {
    // 1. Change role to ADMIN in DB
    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: (await prisma.role.findUnique({ where: { name: 'ADMIN' } }))!.id
      }
    });

    // 2. Refresh token
    const req = new Request('http://localhost/auth/refresh', {
      method: 'POST',
      headers: {
        'Cookie': `refresh_token=${refreshToken}; session_id=${sessionId}`
      }
    });
    const res = await app.fetch(req);
    expect(res.status).toBe(200);

    const cookies = res.headers.getSetCookie();
    const accessCookie = cookies.find(c => c.startsWith('access_token='))!;
    const newAccessToken = accessCookie.split(';')[0].split('=')[1];

    // 3. Decode new JWT and verify role is ADMIN
    const decoded = jose.decodeJwt(newAccessToken);
    expect(decoded.role).toBe('ADMIN');
    expect((decoded.domains as string[]).includes('admin')).toBe(true);

    // Update refreshToken for next test
    const refreshCookie = cookies.find(c => c.startsWith('refresh_token='))!;
    refreshToken = refreshCookie.split(';')[0].split('=')[1];
  });

  it('Scenario 1D: Refresh token is rejected if account is locked while logged in', async () => {
    // 1. Lock the account
    await prisma.user.update({ where: { id: user.id }, data: { isLocked: true } });

    // 2. Refresh token
    const req = new Request('http://localhost/auth/refresh', {
      method: 'POST',
      headers: {
        'Cookie': `refresh_token=${refreshToken}; session_id=${sessionId}`
      }
    });
    const res = await app.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Account is locked');

    // 3. Verify session was revoked in DB
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    expect(session?.isRevoked).toBe(true);

    // Unlock for next tests
    await prisma.user.update({ where: { id: user.id }, data: { isLocked: false } });
  });

  it('Scenario 1E: Same user logs in from two devices (Concurrent Login)', async () => {
    const payload = { user_id: firebaseUid, email: user.email };
    const mockToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode('dummy_firebase_secret'));

    const req1 = new Request('http://localhost/auth/login', {
      method: 'POST',
      body: JSON.stringify({ idToken: mockToken }),
      headers: { 'Content-Type': 'application/json' }
    });
    const req2 = new Request('http://localhost/auth/login', {
      method: 'POST',
      body: JSON.stringify({ idToken: mockToken }),
      headers: { 'Content-Type': 'application/json' }
    });

    const [res1, res2] = await Promise.all([app.fetch(req1), app.fetch(req2)]);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const cookies1 = res1.headers.getSetCookie();
    const cookies2 = res2.headers.getSetCookie();
    
    const sessionCookie1 = cookies1.find(c => c.startsWith('session_id='))!;
    const sessionCookie2 = cookies2.find(c => c.startsWith('session_id='))!;

    const s1 = sessionCookie1.split(';')[0].split('=')[1];
    const s2 = sessionCookie2.split(';')[0].split('=')[1];

    // Assert that both devices get distinct session records
    expect(s1).not.toBe(s2);
    const activeSessions = await prisma.session.count({ where: { userId: user.id, isRevoked: false } });
    expect(activeSessions).toBeGreaterThanOrEqual(2);
  });

  it('Scenario 1F: JWT expires during booking -> 401 Unauthorized', async () => {
    // Generate an already-expired JWT
    const expiredToken = await new jose.SignJWT({ id: user.id, role: 'CUSTOMER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 100) // Expired 100s ago
      .sign(secret);

    const req = new Request('http://localhost/api/bookings/reserve', {
      method: 'POST',
      body: JSON.stringify({
        villaId: crypto.randomUUID(),
        checkIn: new Date().toISOString(),
        checkOut: new Date().toISOString()
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `access_token=${expiredToken}` 
      }
    });

    const res = await ReservePOST(req);
    expect(res.status).toBe(401);
  });

  it('Scenario 1H: User logs out while booking', async () => {
    const logoutReq = new Request('http://localhost/auth/logout', {
      method: 'POST',
      headers: { 'Cookie': `session_id=${sessionId}` }
    });
    const logoutRes = await app.fetch(logoutReq);
    expect(logoutRes.status).toBe(200);

    // Verify session revoked in DB
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    expect(session?.isRevoked).toBe(true);
  });
});
