"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SectionHeading } from "@/components/ui/section-heading";
import { obj, text } from "@/lib/section-content";
import type { Json } from "@/lib/types/database";

type Status = "idle" | "sending" | "done" | "error";

const field =
  "w-full border-b border-ink/25 bg-transparent px-1 py-3 transition-colors duration-300 " +
  "outline-none placeholder:text-ink-muted focus:border-accent";

/** Enquiry form. Insert-only for anonymous visitors; only admins can read replies. */
export function ContactFormSection({
  content,
  productId = null,
  errorMessage,
}: {
  content: Json;
  productId?: string | null;
  errorMessage: string;
}) {
  const c = obj(content);
  const labels = {
    name: text(c.name_label) ?? "Name",
    email: text(c.email_label) ?? "Email",
    subject: text(c.subject_label),
    message: text(c.message_label) ?? "Message",
    button: text(c.button_label),
    success: text(c.success_message),
    consent: text(c.consent_text),
  };

  const [values, setValues] = useState({ name: "", email: "", subject: "", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "sending") return;

    if (honeypot.trim() !== "") {
      setStatus("done");
      return;
    }

    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("enquiries").insert({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      subject: values.subject.trim() || null,
      message: values.message.trim(),
      product_id: productId,
    });

    if (insertError) {
      setStatus("error");
      setError(errorMessage);
      return;
    }
    setStatus("done");
    setValues({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <section className="shell py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          eyebrow={text(c.eyebrow)}
          headline={text(c.headline)}
          subtext={text(c.subtext)}
        />

        {status === "done" && labels.success ? (
          <p role="status" className="mt-12 text-ink-soft">
            {labels.success}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-12 space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <label htmlFor="enquiry-name" className="eyebrow block">
                  {labels.name}
                </label>
                <input
                  id="enquiry-name"
                  required
                  maxLength={120}
                  autoComplete="name"
                  value={values.name}
                  onChange={set("name")}
                  className={`${field} mt-3`}
                />
              </div>
              <div>
                <label htmlFor="enquiry-email" className="eyebrow block">
                  {labels.email}
                </label>
                <input
                  id="enquiry-email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={values.email}
                  onChange={set("email")}
                  className={`${field} mt-3`}
                />
              </div>
            </div>

            {labels.subject ? (
              <div>
                <label htmlFor="enquiry-subject" className="eyebrow block">
                  {labels.subject}
                </label>
                <input
                  id="enquiry-subject"
                  maxLength={200}
                  value={values.subject}
                  onChange={set("subject")}
                  className={`${field} mt-3`}
                />
              </div>
            ) : null}

            <div>
              <label htmlFor="enquiry-message" className="eyebrow block">
                {labels.message}
              </label>
              <textarea
                id="enquiry-message"
                required
                rows={5}
                maxLength={5000}
                value={values.message}
                onChange={set("message")}
                className={`${field} mt-3 resize-y`}
              />
            </div>

            {/* Honeypot */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="enquiry-website">Website</label>
              <input
                id="enquiry-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {labels.button ? (
              <button
                type="submit"
                disabled={status === "sending"}
                className="border border-ink/25 px-9 py-3.5 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-500 ease-[var(--ease-editorial)] hover:border-ink hover:bg-ink hover:text-canvas disabled:opacity-50"
              >
                {labels.button}
              </button>
            ) : null}

            {error ? (
              <p role="alert" className="text-sm text-ink-soft">
                {error}
              </p>
            ) : null}
            {labels.consent ? <p className="text-xs text-ink-muted">{labels.consent}</p> : null}
          </form>
        )}
      </div>
    </section>
  );
}
