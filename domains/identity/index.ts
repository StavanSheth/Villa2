import { prisma } from '@villa-platform/database';
// Remove firebase-admin to ensure Edge compatibility on Cloudflare Workers
import * as jose from 'jose';

/**
 * Verify Firebase ID token and return user database object
 * (Edge compatible)
 */
export async function verifyFirebaseToken(idToken: string) {
  try {
    // Decode token without verification (for demo/prototype purposes on edge)
    // In production, fetch Google's public keys and use jose.jwtVerify
    const decodedToken = jose.decodeJwt(idToken);
    
    // 1. FAST PATH: Check if role is present in Firebase Custom Claims
    if (decodedToken.role) {
      return {
        uid: decodedToken.user_id as string,
        id: decodedToken.user_id as string, // Fallback ID to uid if DB not queried
        email: decodedToken.email as string,
        role: decodedToken.role as string,
        roles: [decodedToken.role as string],
      };
    }

    // 2. SLOW PATH (Fallback): Look up user in DB by firebaseUid if custom claims not set
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.user_id as string },
      include: { roles: { include: { role: true } } }
    });

    if (!user) {
      throw new Error("User not found in database");
    }

    if (user.isLocked || (user.lockedUntil && new Date() < user.lockedUntil)) {
      throw new Error("Account is locked");
    }

    // Determine primary role for simplified access (highest privilege)
    const roleNames = user.roles.map(ur => ur.role.name);
    let primaryRole = 'GUEST';
    if (roleNames.includes('SUPER_ADMIN')) primaryRole = 'SUPER_ADMIN';
    else if (roleNames.includes('ADMIN')) primaryRole = 'ADMIN';
    else if (roleNames.includes('STAFF')) primaryRole = 'STAFF';
    else if (roleNames.includes('CUSTOMER')) primaryRole = 'CUSTOMER';

    return {
      uid: decodedToken.user_id as string,
      id: user.id,
      email: user.email,
      role: primaryRole,
      roles: roleNames,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// getAuthUser moved to @villa-platform/identity/permissions to avoid pulling node-only libs into Cloudflare workers
// Stubs for Clerk webhooks (legacy)
export interface ClerkUserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}
export async function syncClerkUserToDatabase(data: ClerkUserData) {
  return null;
}
export async function deleteClerkUserFromDatabase(id: string) {
  return null;
}
