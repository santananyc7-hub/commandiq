import { NextResponse } from "next/server";
import { buildAuthUrl, getQboConfig } from "@/lib/integrations/quickbooks";

export const runtime = "nodejs";

/**
 * Begin the QuickBooks OAuth2 handshake (§17). Redirects to Intuit's consent
 * screen when credentials are configured; otherwise returns to Settings with a
 * demo-mode notice. State should be persisted/validated in production.
 */
export async function GET() {
  const config = getQboConfig();
  if (!config) {
    return NextResponse.redirect(
      new URL("/settings?qbo=demo", process.env.APP_URL ?? "http://localhost:3005")
    );
  }
  const state = `ciq-${Math.abs(hashCode(config.clientId)).toString(36)}`;
  return NextResponse.redirect(buildAuthUrl(config, state));
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
