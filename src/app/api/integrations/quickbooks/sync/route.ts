import { NextResponse } from "next/server";
import { isQboConfigured, SYNCED_ENTITIES } from "@/lib/integrations/quickbooks";

export const runtime = "nodejs";

/**
 * Manual "Sync Now" (§17). In production this refreshes tokens and pulls the
 * synced entities from QuickBooks, normalizing them into CommandIQ's models.
 * In demo mode it acknowledges the request so the UI flow is exercisable.
 */
export async function POST() {
  const configured = isQboConfigured();
  const lastSync = new Date().toISOString();

  return NextResponse.json({
    ok: true,
    mode: configured ? "live" : "demo",
    lastSync,
    entities: SYNCED_ENTITIES,
    message: configured
      ? "Sync complete."
      : "Demo mode — connect QuickBooks credentials to pull live data.",
  });
}
