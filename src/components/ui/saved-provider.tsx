"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listSavedIds, toggleWishlist } from "@/lib/wishlist";

type SavedContext = {
  /** Null until the first read lands, so a card can render "unknown" rather than "not saved". */
  ids: Set<string> | null;
  isSaved: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  busy: Set<string>;
};

const Context = createContext<SavedContext | null>(null);

/**
 * One read of the viewer's saved items for the whole page.
 *
 * Saved state is per-visitor and every page here is prerendered, so this is
 * deliberately a client-side read after hydration: the HTML stays cacheable and
 * shared by everyone, and the hearts fill in afterwards.
 */
export function SavedProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ids, setIds] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  useEffect(() => {
    let live = true;
    listSavedIds()
      .then((list) => live && setIds(new Set(list)))
      .catch(() => live && setIds(new Set()));
    return () => {
      live = false;
    };
  }, []);

  const isSaved = useCallback((productId: string) => ids?.has(productId) ?? false, [ids]);

  const toggle = useCallback(
    async (productId: string) => {
      // Optimistic: a heart that waits on a round trip to fill reads as broken.
      const before = ids ?? new Set<string>();
      const next = new Set(before);
      const wasSaved = next.has(productId);
      if (wasSaved) next.delete(productId);
      else next.add(productId);
      setIds(next);
      setBusy((b) => new Set(b).add(productId));

      const result = await toggleWishlist(productId);

      setBusy((b) => {
        const copy = new Set(b);
        copy.delete(productId);
        return copy;
      });

      if (!result.ok) {
        setIds(before);
        if (result.needsSignIn) {
          router.push(`/account?next=${encodeURIComponent(window.location.pathname)}`);
        }
      }
    },
    [ids, router],
  );

  const value = useMemo<SavedContext>(
    () => ({ ids, isSaved, toggle, busy }),
    [ids, isSaved, toggle, busy],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSaved() {
  const context = useContext(Context);
  if (!context) throw new Error("useSaved must be used inside SavedProvider");
  return context;
}
