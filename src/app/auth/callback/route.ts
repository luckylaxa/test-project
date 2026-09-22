import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exchanges an auth cookie, so it must run per request.
export const instant = false;

/**
 * Where Google (or any OAuth provider) sends the customer back to.
 *
 * Supabase hands us a one-time `code`; swapping it for a session is what
 * actually signs the person in, and it has to happen on the server so the
 * session cookie is set with the right flags.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Only ever redirect inside this site. An attacker who can craft the link
  // could otherwise bounce someone to their own page wearing our domain.
  const requested = searchParams.get("next") ?? "/account";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/account";

  // Behind Vercel's proxy the request URL is the internal host, so trust the
  // forwarded one when it is there, or the customer lands on a URL they have
  // no session for.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const base =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `${forwardedProto}://${forwardedHost}`;

  if (!code) {
    // Arriving with no code means the provider refused or the customer
    // cancelled. Send them back to sign in rather than to a blank page.
    return NextResponse.redirect(`${base}/account?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${base}/account?error=auth`);
  }

  return NextResponse.redirect(`${base}${next}`);
}
