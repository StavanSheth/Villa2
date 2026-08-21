// apps/web/src/app/api/webhooks/clerk/route.ts
// Clerk Webhook — Syncs user creation/update/deletion to PostgreSQL
// Ponytail: Uses svix for Clerk webhook signature verification and @villa-platform/auth user synchronization

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { syncClerkUserToDatabase, deleteClerkUserFromDatabase, ClerkUserData } from "@villa-platform/auth";

interface ClerkUserEvent {
  data: ClerkUserData;
  type: string;
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing CLERK_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  // Verify webhook signature
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);
  let event: ClerkUserEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  const { data, type } = event;

  switch (type) {
    case "user.created":
    case "user.updated": {
      const dbUser = await syncClerkUserToDatabase(data);
      console.log(`[Clerk Webhook] ${type}: synced user ${dbUser.email} (${dbUser.role})`);
      break;
    }

    case "user.deleted": {
      await deleteClerkUserFromDatabase(data.id);
      console.log(`[Clerk Webhook] user.deleted: ${data.id}`);
      break;
    }

    default:
      console.log(`[Clerk Webhook] Unhandled event type: ${type}`);
  }

  return NextResponse.json({ received: true });
}
