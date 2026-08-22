// packages/auth/clerk/webhook.ts
// Clerk Webhook User Synchronizer
// Ponytail: Automatically upserts users into PostgreSQL via Prisma on Clerk auth events

import { prisma, Role } from "@villa-platform/database";
import type { PlatformRole } from "@villa-platform/authorization";

export interface ClerkUserData {
  id: string; // Clerk ID (user_xxxx)
  email_addresses: Array<{
    id: string;
    email_address: string;
  }>;
  primary_email_address_id?: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  public_metadata?: {
    role?: string;
  };
}

/**
 * Synchronizes a Clerk User object with the local database User table.
 * Resolves role from public metadata or defaults to CUSTOMER.
 */
export async function syncClerkUserToDatabase(clerkUser: ClerkUserData) {
  const primaryEmailObj = clerkUser.email_addresses.find(
    (e) => e.id === clerkUser.primary_email_address_id
  ) || clerkUser.email_addresses[0];

  const email = primaryEmailObj ? primaryEmailObj.email_address : `${clerkUser.id}@noemail.mavon.online`;
  const name = [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") || "Mavon Guest";

  const rawRole = (clerkUser.public_metadata?.role || "CUSTOMER").toUpperCase();
  const validRoles: string[] = ["SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"];
  const role: Role = validRoles.includes(rawRole) ? (rawRole as Role) : Role.CUSTOMER;

  const dbUser = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
      name,
      avatarUrl: clerkUser.image_url || null,
      role,
      isActive: true,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      name,
      avatarUrl: clerkUser.image_url || null,
      role,
      isActive: true,
    },
  });

  return dbUser;
}

/**
 * Deletes a user from local database when deleted in Clerk
 */
export async function deleteClerkUserFromDatabase(clerkId: string) {
  try {
    const deleted = await prisma.user.delete({
      where: { clerkId },
    });
    return deleted;
  } catch {
    // User might not exist locally
    return null;
  }
}
