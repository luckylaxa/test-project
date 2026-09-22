import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// Exchanges a token for a session, so it must run per request.
export const instant = false;

/**
 * Where a confirmation email lands.
 *
 * Supabase's default template sends people to its own `/auth/v1/verify`, which
 * verifies and then bounces to the project's Site URL. If that is still
 * `localhost:3000` the customer gets "site can't be reached" — the link is
 * fine, the destination is not.
 *
 * This route is the other half: point the email template at
 * `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .EmailActionType }}`
 * and the token is redeemed here, on the site itself, so a failure can be
 * shown as a page rather than a dead browser tab.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Only ever redirect inside this site.
  const requested = searchParams.get("next") ?? "/account";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/account";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const base =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `${forwardedProto}://${forwardedHost}`;

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${base}/account?error=confirm`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  // A used or expired link is the common case, and it must not dead-end:
  // send them to sign in with something to read.
  if (error) return NextResponse.redirect(`${base}/account?error=confirm`);

  return NextResponse.redirect(`${base}${next}`);
}
