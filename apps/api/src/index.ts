import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { rateLimiter } from './middleware/rate-limit';
import { SignJWT } from 'jose';
import { verifyFirebaseToken } from '@villa-platform/identity';
import { prisma } from '@villa-platform/database';

const app = new Hono<{ Bindings: { JWT_SECRET: string } }>();

// 1. Global limit on request payload size (Category 3: Resilience)
// Blocks massive JSON payloads from exhausting memory
app.use(
  '*',
  bodyLimit({
    maxSize: 512 * 1024, // 512 KB
    onError: (c) => {
      return c.json({ success: false, error: 'Payload Too Large' }, 413);
    },
  })
);

// 2. Global rate limiting (Category 3: Resilience)
// 100 requests per minute per IP
app.use(
  '*',
  rateLimiter({
    windowMs: 60 * 1000,
    max: 100
  })
);

// Basic Health Check
app.get('/health', (c) => c.json({ status: 'ok', service: 'mavon-api' }));

// POST /auth/login
// Expects JSON { idToken: string }
app.post('/auth/login', async (c) => {
  try {
    const { idToken } = await c.req.json();
    if (!idToken) return c.json({ success: false, error: 'Missing idToken' }, 400);

    const user = await verifyFirebaseToken(idToken);
    if (!user) return c.json({ success: false, error: 'Invalid Token' }, 401);

    // Rate Limiting & Login Attempts tracking
    await prisma.loginAttempt.create({
      data: {
        email: user.email,
        userId: user.id,
        success: true,
        ipAddress: c.req.header('cf-connecting-ip') || '127.0.0.1',
        userAgent: c.req.header('user-agent') || 'Unknown',
      }
    });

    // Create session
    const refreshToken = crypto.randomUUID(); // In production, hash this!
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: refreshToken, // Hash before storing
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours absolute
        lastActiveAt: new Date(),
        ipAddress: c.req.header('cf-connecting-ip') || '127.0.0.1',
        userAgent: c.req.header('user-agent') || 'Unknown',
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        resource: 'Session',
        userId: user.id,
        role: user.role,
        sessionId: session.id,
        ipAddress: session.ipAddress,
      }
    });

    // Generate Custom JWT for Edge Middleware (15 mins)
    const secret = new TextEncoder().encode(c.env?.JWT_SECRET || 'mavon_super_secret_jwt_key_for_edge_verification');
    const accessToken = await new SignJWT({ 
      uid: user.uid, 
      id: user.id,
      role: user.role,
      domains: user.role === 'SUPER_ADMIN' ? ['*'] : 
               user.role === 'ADMIN' ? ['admin', 'staff', 'booking'] :
               user.role === 'STAFF' ? ['staff', 'booking'] : ['booking']
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret);

    // We don't set cookies directly in the API if it's cross-origin, 
    // but assuming api.mavon.online shares the root domain:
    const cookieOptions = `HttpOnly; Secure; SameSite=Lax; Path=/; Domain=.mavon.online; Max-Age=86400`;
    
    // In Hono, we can set headers
    c.header('Set-Cookie', `access_token=${accessToken}; ${cookieOptions}`);
    c.header('Set-Cookie', `refresh_token=${refreshToken}; ${cookieOptions}`, { append: true });
    c.header('Set-Cookie', `session_id=${session.id}; ${cookieOptions}`, { append: true });

    return c.json({ success: true, message: 'Logged in successfully' });

  } catch (error) {
    console.error(error);
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
  }
});

// POST /auth/refresh
// Expects cookies: refresh_token and session_id
app.post('/auth/refresh', async (c) => {
  // Read cookies (simplified for brevity)
  const cookieHeader = c.req.header('Cookie') || '';
  const matchRefresh = cookieHeader.match(/refresh_token=([^;]+)/);
  const matchSession = cookieHeader.match(/session_id=([^;]+)/);

  if (!matchRefresh || !matchSession) {
    return c.json({ success: false, error: 'Missing tokens' }, 401);
  }

  const oldRefreshToken = matchRefresh[1];
  const sessionId = matchSession[1];

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { include: { roles: { include: { role: true } } } } }
    });

    if (!session || session.isRevoked || session.refreshToken !== oldRefreshToken || new Date() > session.expiresAt) {
      // Replay attack detection / Invalid session
      if (session) {
        await prisma.session.update({ where: { id: sessionId }, data: { isRevoked: true } });
      }
      return c.json({ success: false, error: 'Session invalid or revoked' }, 401);
    }

    if (session.user.isLocked || (session.user.lockedUntil && new Date() < session.user.lockedUntil)) {
      await prisma.session.update({ where: { id: sessionId }, data: { isRevoked: true } });
      return c.json({ success: false, error: 'Account is locked' }, 403);
    }

    // Check idle timeout (30 mins)
    const idleTime = Date.now() - session.lastActiveAt.getTime();
    if (idleTime > 30 * 60 * 1000) {
      await prisma.session.update({ where: { id: sessionId }, data: { isRevoked: true } });
      return c.json({ success: false, error: 'Idle timeout exceeded' }, 401);
    }

    // Rotate refresh token
    const newRefreshToken = crypto.randomUUID();
    await prisma.session.update({
      where: { id: sessionId },
      data: { 
        refreshToken: newRefreshToken,
        lastActiveAt: new Date() 
      }
    });

    // Generate Custom JWT for Edge Middleware (15 mins)
    const roleNames = session.user.roles.map(r => r.role.name);
    const primaryRole = roleNames.includes('SUPER_ADMIN') ? 'SUPER_ADMIN' :
                        roleNames.includes('ADMIN') ? 'ADMIN' :
                        roleNames.includes('STAFF') ? 'STAFF' : 'CUSTOMER';

    const secret = new TextEncoder().encode(c.env?.JWT_SECRET || 'mavon_super_secret_jwt_key_for_edge_verification');
    const accessToken = await new SignJWT({ 
      uid: session.user.firebaseUid, 
      id: session.user.id,
      role: primaryRole,
      domains: primaryRole === 'SUPER_ADMIN' ? ['*'] : 
               primaryRole === 'ADMIN' ? ['admin', 'staff', 'booking'] :
               primaryRole === 'STAFF' ? ['staff', 'booking'] : ['booking']
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret);

    const cookieOptions = `HttpOnly; Secure; SameSite=Lax; Path=/; Domain=.mavon.online; Max-Age=86400`;
    
    c.header('Set-Cookie', `access_token=${accessToken}; ${cookieOptions}`);
    c.header('Set-Cookie', `refresh_token=${newRefreshToken}; ${cookieOptions}`, { append: true });

    return c.json({ success: true, message: 'Token rotated successfully' });

  } catch (error) {
    console.error(error);
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
  }
});

// POST /auth/logout
app.post('/auth/logout', async (c) => {
  const cookieHeader = c.req.header('Cookie') || '';
  const matchSession = cookieHeader.match(/session_id=([^;]+)/);

  if (matchSession) {
    const sessionId = matchSession[1];
    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true }
    });
  }

  // Clear cookies
  const cookieOptions = `HttpOnly; Secure; SameSite=Lax; Path=/; Domain=.mavon.online; Max-Age=0`;
  c.header('Set-Cookie', `access_token=; ${cookieOptions}`);
  c.header('Set-Cookie', `refresh_token=; ${cookieOptions}`, { append: true });
  c.header('Set-Cookie', `session_id=; ${cookieOptions}`, { append: true });

  return c.json({ success: true, message: 'Logged out successfully' });
});

import payments from './routes/payments';
import invoices from './routes/invoices';
import reviews from './routes/reviews';
import bookingEngine from './routes/booking-engine';
import refundPolicy from './routes/refund-policy';

app.route('/payments', payments);
app.route('/invoices', invoices);
app.route('/reviews', reviews);
app.route('/booking-engine', bookingEngine);
app.route('/villas', refundPolicy);


import { handleAbandonedBookings } from './cron/abandonedBookings';
import { expireReservationLocks } from './cron/expireLocks';
import { processBookingQueue } from './queues/bookingQueue';

export default {

  fetch: app.fetch,
  async scheduled(event: any, env: any, ctx: any) {
    ctx.waitUntil(handleAbandonedBookings(env));
    ctx.waitUntil(expireReservationLocks());
  },
  async queue(batch: any, env: any, ctx: any) {
    ctx.waitUntil(processBookingQueue(batch, env));
  }
};
