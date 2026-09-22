import { cacheLife } from "next/cache";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Does this project actually have Google sign-in switched on?
 *
 * Asking the auth server is better than a setting of our own. A toggle has to
 * be remembered and kept in step with the Supabase dashboard; when it drifts,
 * either the button is missing for no visible reason or it sends people to a
 * provider error page with no way back. This cannot drift: the button appears
 * the moment Google is configured, and not before.
 *
 * Cached, because it is the same answer for everyone and changes only when
 * somebody edits the dashboard.
 */
export async function isGoogleEnabled(): Promise<boolean> {
  "use cache";
  cacheLife("minutes");

  try {
    const { url, key } = supabaseEnv();
    const response = await fetch(
      `${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(url)}`,
      { headers: { apikey: key }, redirect: "manual" },
    );
    // Configured: the auth server answers with a redirect to Google.
    // Not configured: 400, "Unsupported provider: provider is not enabled".
    return response.status >= 300 && response.status < 400;
  } catch {
    // Never let a network blip remove the button's only alternative.
    return false;
  }
}
