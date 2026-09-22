"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { obj, text } from "@/lib/section-content";
import type { Json } from "@/lib/types/database";

type Status = "idle" | "sending" | "done" | "error";

/**
 * Newsletter signup. Inserts straight into Supabase under the insert-only
 * anonymous policy — the browser can add a row but can never read the list back.
 */
export function NewsletterSection({
  content,
  errorMessage,
}: {
  content: Json;
  errorMessage: string;
}) {
  const c = obj(content);
  const eyebrow = text(c.eyebrow);
  const headline = text(c.headline);
  const subtext = text(c.subtext);
  const placeholder = text(c.placeholder) ?? "";
  const buttonLabel = text(c.button_label);
  const successMessage = text(c.success_message);
  const consentText = text(c.consent_text);

  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  if (!headline && !buttonLabel && !subtext) return null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "sending") return;

    // Honeypot: a real person never fills a field they cannot see.
    // Report success so a bot learns nothing from the difference.
    if (honeypot.trim() !== "") {
      setStatus("done");
      return;
    }

    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase(), source: "website" });

    if (insertError) {
      // A duplicate email is not a failure worth showing the visitor.
      if (insertError.code === "23505") {
        setStatus("done");
        return;
      }
      setStatus("error");
      setError(errorMessage);
      return;
    }
    setStatus("done");
    setEmail("");
  }

  return (
    <section className="border-t border-line py-24 md:py-32">
      <div className="shell mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {headline ? <h2 className="mt-5 text-4xl md:text-5xl">{headline}</h2> : null}
        {subtext ? <p className="mt-6 text-ink-soft">{subtext}</p> : null}

        {status === "done" && successMessage ? (
          <p role="status" className="mt-10 text-ink-soft">
            {successMessage}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-10">
            <div className="flex flex-col gap-4 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">
                {placeholder || "Email address"}
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                className="min-w-0 flex-1 border-b border-ink/25 bg-transparent px-1 py-3 text-center transition-colors duration-300 outline-none placeholder:text-ink-muted focus:border-accent sm:text-left"
              />

              {/* Honeypot — hidden from people, irresistible to bots. */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="newsletter-company">Company</label>
                <input
                  id="newsletter-company"
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {buttonLabel ? (
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="shrink-0 border border-ink/25 px-8 py-3 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-500 ease-[var(--ease-editorial)] hover:border-ink hover:bg-ink hover:text-canvas disabled:opacity-50"
                >
                  {buttonLabel}
                </button>
              ) : null}
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-sm text-ink-soft">
                {error}
              </p>
            ) : null}
            {consentText ? <p className="mt-5 text-xs text-ink-muted">{consentText}</p> : null}
          </form>
        )}
      </div>
    </section>
  );
}
