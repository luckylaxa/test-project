"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleWishlist } from "@/lib/wishlist";

/**
 * Save a product for later.
 *
 * Optimistic: the heart fills immediately and reverts if the write fails,
 * because waiting on a round trip to acknowledge a like feels broken.
 */
export function SaveButton({
  productId,
  initiallySaved,
  labels,
}: {
  productId: string;
  initiallySaved: boolean;
  labels: { add: string; remove: string; signIn: string };
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle() {
    const next = !saved;
    setSaved(next);
    setBusy(true);
    setMessage(null);

    const result = await toggleWishlist(productId);
    setBusy(false);

    if (!result.ok) {
      setSaved(!next);
      if (result.needsSignIn) {
        setMessage(labels.signIn);
        router.push(`/account?next=${encodeURIComponent(window.location.pathname)}`);
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        className="tap gap-2 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:text-accent-text disabled:opacity-50"
      >
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M12 21s-7.5-4.6-9.4-9A5.3 5.3 0 0 1 12 6.6 5.3 5.3 0 0 1 21.4 12c-1.9 4.4-9.4 9-9.4 9z" />
        </svg>
        {saved ? labels.remove : labels.add}
      </button>
      {message ? (
        <p role="status" className="mt-2 text-sm text-ink-soft">
          {message}
        </p>
      ) : null}
    </>
  );
}
