"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type AuthLabels = {
  signInTitle: string;
  signUpTitle: string;
  signInCta: string;
  signUpCta: string;
  toSignUp: string;
  toSignIn: string;
  checkEmail: string;
  google: string;
  or: string;
  email: string;
  password: string;
  passwordHelp: string;
  reason: string | null;
  errors: {
    credentials: string;
    emailTaken: string;
    emailInvalid: string;
    weakPassword: string;
    rateLimited: string;
    network: string;
    generic: string;
    oauth: string;
    confirm: string;
  };
};

/**
 * The provider's own error text is English, uneditable and occasionally
 * mentions its own internals, so map the codes we can recognise onto the
 * maison's wording and fall back to something calm for the rest.
 */
function messageFor(error: unknown, errors: AuthLabels["errors"]): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  switch (code) {
    case "invalid_credentials":
    case "invalid_grant":
      return errors.credentials;
    case "user_already_exists":
    case "email_exists":
      return errors.emailTaken;
    case "email_address_invalid":
    case "email_address_not_authorized":
      return errors.emailInvalid;
    case "weak_password":
      return errors.weakPassword;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
    case "too_many_requests":
      return errors.rateLimited;
    default:
      return errors.generic;
  }
}

const input =
  "w-full border border-line-strong bg-canvas px-3 py-2.5 text-sm outline-none " +
  "transition-colors duration-200 focus:border-accent";

/**
 * Customer sign in and registration.
 *
 * Being a customer grants nothing but your own record — administrators are a
 * separate list, so opening registration cannot create one.
 */
export function AuthForm({
  labels,
  googleEnabled,
}: {
  labels: AuthLabels;
  /** Off until the provider is actually enabled in Supabase, or the button
   *  would send customers to a provider error page they cannot get back from. */
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"in" | "up">(params.get("mode") === "up" ? "up" : "in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const failure = params.get("error");
  const callbackMessage =
    failure === "auth" ? labels.errors.oauth : failure === "confirm" ? labels.errors.confirm : null;

  // Where to return to once the provider sends them back. Carried through the
  // round trip so someone who was mid-checkout lands back on checkout.
  // Only same-site paths: a `next` from the address bar is attacker-supplied.
  const requested = params.get("next") ?? "";
  const returnTo =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/account";

  async function withGoogle() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`,
        },
      });
      // On success the browser is already navigating to Google, so there is
      // nothing to do here but handle the case where it never left.
      if (oauthError) {
        setError(labels.errors.oauth);
        setBusy(false);
      }
    } catch {
      setError(labels.errors.network);
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();

      if (mode === "up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) {
          setError(messageFor(signUpError, labels.errors));
          setBusy(false);
          return;
        }
        // With email confirmation on, there is no session yet.
        if (!data.session) {
          setSent(true);
          setBusy(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(messageFor(signInError, labels.errors));
          setBusy(false);
          return;
        }
      }
    } catch {
      setError(labels.errors.network);
      setBusy(false);
      return;
    }

    router.replace(returnTo);
    router.refresh();
  }

  if (sent) {
    return (
      <p role="status" className="border border-line px-5 py-4 text-sm text-ink-soft">
        {labels.checkEmail}
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-4xl md:text-5xl">
        {mode === "up" ? labels.signUpTitle : labels.signInTitle}
      </h1>

      {labels.reason ? (
        <p className="measure mt-4 text-sm text-ink-soft">{labels.reason}</p>
      ) : null}

      {googleEnabled ? (
        <>
          <button
            type="button"
            onClick={withGoogle}
            disabled={busy}
            className="mt-8 flex w-full items-center justify-center gap-3 border border-line px-6 py-3.5 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink disabled:opacity-50"
          >
            <GoogleMark />
            {labels.google}
          </button>

          <div className="mt-6 flex items-center gap-4" aria-hidden>
            <span className="h-px flex-1 bg-line" />
            <span className="text-[0.625rem] tracking-[0.16em] text-ink-muted uppercase">
              {labels.or}
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      ) : null}

      <form onSubmit={submit} className={`${googleEnabled ? "mt-6" : "mt-8"} space-y-5`}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-[0.6875rem] tracking-[0.14em] uppercase">
            {labels.email}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-[0.6875rem] tracking-[0.14em] uppercase">
            {labels.password}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
          />
          {mode === "up" ? (
            <p className="text-xs text-ink-muted">{labels.passwordHelp}</p>
          ) : null}
        </div>

        {error || callbackMessage ? (
          <p role="alert" className="border border-line px-4 py-3 text-sm text-ink-soft">
            {error ?? callbackMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-ink px-6 py-3.5 text-[0.6875rem] tracking-[0.2em] text-canvas uppercase transition-colors duration-500 hover:bg-accent hover:text-ink disabled:opacity-50"
        >
          {mode === "up" ? labels.signUpCta : labels.signInCta}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "up" ? "in" : "up");
          setError(null);
        }}
        className="mt-6 text-[0.6875rem] tracking-[0.16em] text-ink-muted uppercase transition-colors hover:text-ink"
      >
        {mode === "up" ? labels.toSignIn : labels.toSignUp}
      </button>
    </div>
  );
}

/** Google's mark, inline so the button makes no third-party request. */
function GoogleMark() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
