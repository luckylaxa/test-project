"use client";

import { useState, useTransition } from "react";
import { setHandled } from "./actions";

export function EnquiryRow({
  id,
  name,
  email,
  subject,
  message,
  productName,
  createdAt,
  handled,
}: {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  productName: string | null;
  createdAt: string;
  handled: boolean;
}) {
  const [isHandled, setIsHandled] = useState(handled);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <li className={`border-b border-line py-4 ${isHandled ? "opacity-55" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="block text-sm">
            {name}
            <span className="text-ink-muted"> · {email}</span>
          </span>
          <span className="block text-[0.625rem] tracking-[0.12em] text-ink-muted uppercase">
            {new Date(createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {subject ? ` · ${subject}` : ""}
            {productName ? ` · about ${productName}` : ""}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href={`mailto:${email}${subject ? `?subject=${encodeURIComponent(`Re: ${subject}`)}` : ""}`}
            className="text-[0.6875rem] tracking-[0.14em] uppercase transition-colors hover:text-accent-text"
          >
            Reply
          </a>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const next = !isHandled;
              setIsHandled(next);
              start(() => {
                void setHandled(id, next);
              });
            }}
            className="text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink disabled:opacity-40"
          >
            {isHandled ? "Mark unanswered" : "Mark answered"}
          </button>
        </div>
      </div>

      {open ? (
        <p className="mt-3 max-w-2xl border-l border-line pl-4 text-sm whitespace-pre-line text-ink-soft">
          {message}
        </p>
      ) : null}
    </li>
  );
}
