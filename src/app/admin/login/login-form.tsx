"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ denied }: { denied: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    denied ? "That account is not an administrator of this site." : null,
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        // Deliberately vague: never reveal whether an address has an account.
        setError("That email and password did not match.");
        setBusy(false);
        return;
      }
    } catch {
      // A thrown error here means the request never completed — offline, a
      // blocked request, a misconfigured key. Without this the button simply
      // did nothing and the person was left guessing.
      setError("We could not reach the server. Check your connection and try again.");
      setBusy(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  const input =
    "w-full border border-line-strong bg-canvas px-3 py-2.5 text-sm outline-none " +
    "transition-colors duration-200 focus:border-accent";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-[0.6875rem] tracking-[0.14em] uppercase">
          Email
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
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
      </div>

      {error ? (
        <p role="alert" className="border border-line px-4 py-3 text-sm text-ink-soft">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-ink px-6 py-3 text-[0.6875rem] tracking-[0.2em] text-canvas uppercase transition-colors duration-300 hover:bg-accent hover:text-ink disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
