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
  "w-full border border-line bg-canvas px-3 py-2.5 text-sm outline-none " +
  "transition-colors duration-200 focus:border-accent";

/**
 * Customer sign in and registration.
 *
 * Being a customer grants nothing but your own record — administrators are a
 * separate list, so opening registration cannot create one.
 */
export function AuthForm({ labels }: { labels: AuthLabels }) {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"in" | "up">(params.get("mode") === "up" ? "up" : "in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

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

    router.replace("/account");
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

      <form onSubmit={submit} className="mt-8 space-y-5">
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

        {error ? (
          <p role="alert" className="border border-line px-4 py-3 text-sm text-ink-soft">
            {error}
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
