import { NextResponse } from "next/server";
import { exchangeCode, getQboConfig } from "@/lib/integrations/quickbooks";

export const runtime = "nodejs";

/**
 * QuickBooks OAuth2 redirect handler (§17).
 *
 * Exchanges the authorization code for bearer tokens. In production the tokens
 * are encrypted at rest and associated with the organization; here we complete
 * the exchange and return to Settings. Secrets never touch the client.
 */
export async function GET(req: Request) {
  const config = getQboConfig();
  const appUrl = process.env.APP_URL ?? "http://localhost:3005";
  if (!config) {
    return NextResponse.redirect(new URL("/settings?qbo=demo", appUrl));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const realmId = url.searchParams.get("realmId");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/settings?qbo=error`, appUrl));
  }
  if (!code || !realmId) {
    return NextResponse.redirect(new URL(`/settings?qbo=error`, appUrl));
  }

  try {
    await exchangeCode(config, code, realmId);
    // TODO: persist encrypted tokens + realmId, kick off initial sync.
    return NextResponse.redirect(new URL(`/settings?qbo=connected`, appUrl));
  } catch {
    return NextResponse.redirect(new URL(`/settings?qbo=error`, appUrl));
  }
}
