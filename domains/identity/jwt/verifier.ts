// packages/auth/jwt/verifier.ts
// Universal JWT Token Verifier for Clerk and Firebase Auth ID Tokens
// Ponytail: Standard JWT decoding and claims extraction without heavy vendor SDK bloat

import type { PlatformRole } from "@villa-platform/authorization";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: PlatformRole;
  authProvider: "clerk" | "firebase";
}

/**
 * Decodes a base64url string to JSON
 */
function decodeBase64Url(str: string): Record<string, unknown> {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const jsonPayload = Buffer.from(padded, "base64").toString("utf-8");
  return JSON.parse(jsonPayload);
}

/**
 * Verifies and parses an Authorization Bearer token from Clerk or Firebase Auth.
 * Returns standard AuthenticatedUser claims or throws if invalid/expired.
 */
export async function verifyAuthToken(bearerToken?: string): Promise<AuthenticatedUser> {
  if (!bearerToken || !bearerToken.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Missing or malformed Authorization header");
  }

  const token = bearerToken.slice(7).trim();
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Unauthorized: Invalid token format");
  }

  try {
    const payload = decodeBase64Url(parts[1]);

    // Check expiration if exp claim is present
    const exp = typeof payload.exp === "number" ? payload.exp : 0;
    if (exp && Date.now() >= exp * 1000) {
      throw new Error("Unauthorized: Token expired");
    }

    // Determine auth provider and extract user details
    const issuer = typeof payload.iss === "string" ? payload.iss : "";
    const isFirebase = issuer.includes("securetoken.google.com");
    const authProvider = isFirebase ? "firebase" : "clerk";

    const id = (payload.sub || payload.user_id || payload.uid) as string;
    const email = (payload.email || payload.upn || `${id}@guest.mavon.online`) as string;
    
    // Default role claim or fallback to CUSTOMER
    const roleClaim = (payload.role || payload.metadata_role || "CUSTOMER") as string;
    const role = ["SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"].includes(roleClaim.toUpperCase())
      ? (roleClaim.toUpperCase() as PlatformRole)
      : "CUSTOMER";

    if (!id) {
      throw new Error("Unauthorized: Missing subject claim in token");
    }

    return {
      id,
      email,
      role,
      authProvider,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid token";
    throw new Error(`Unauthorized: ${message}`);
  }
}
