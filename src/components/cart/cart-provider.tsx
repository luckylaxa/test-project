"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { CART_STORAGE_KEY, MAX_QUANTITY, sameLine, type CartLine } from "@/lib/cart/types";

/* ------------------------------------------------------------------ store */

/**
 * localStorage is an external store, so it is read through
 * useSyncExternalStore rather than copied into state inside an effect. That
 * avoids both the hydration mismatch (the server has no basket) and the extra
 * render an effect would cause, and it keeps two open tabs in step for free.
 */

const listeners = new Set<() => void>();

let snapshot = "[]";

function readRaw(): string {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]";
  } catch {
    // Private browsing, blocked storage, or a full quota.
    return snapshot;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changing the basket should update this one.
  const onStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY) {
      snapshot = readRaw();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): string {
  // Must return a stable reference when nothing changed, or React loops.
  const raw = readRaw();
  if (raw !== snapshot) snapshot = raw;
  return snapshot;
}

/** The server has no basket, so it always renders an empty one. */
function getServerSnapshot(): string {
  return "[]";
}

function write(lines: CartLine[]) {
  snapshot = JSON.stringify(lines);
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, snapshot);
  } catch {
    // The basket still works for this visit even if it cannot be persisted.
  }
  listeners.forEach((l) => l());
}

/** Storage is user-writable, so validate the shape rather than trusting it. */
function parse(raw: string): CartLine[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l) =>
          l &&
          typeof l.productId === "string" &&
          (l.shadeId === null || typeof l.shadeId === "string") &&
          Number.isInteger(l.quantity) &&
          l.quantity > 0,
      )
      .slice(0, 50)
      .map((l) => ({
        productId: l.productId,
        shadeId: l.shadeId ?? null,
        quantity: Math.min(l.quantity, MAX_QUANTITY),
      }));
  } catch {
    return [];
  }
}

/* --------------------------------------------------------------- provider */

type CartContext = {
  lines: CartLine[];
  count: number;
  add: (line: CartLine) => void;
  setQuantity: (line: CartLine, quantity: number) => void;
  remove: (line: CartLine) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const Context = createContext<CartContext | null>(null);

/**
 * The basket lives entirely in the browser: no server-side cart, no cart table,
 * no cookie. It holds identifiers only — what anything costs is decided by the
 * server at checkout.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const lines = useMemo(() => parse(raw), [raw]);
  const [open, setOpen] = useState(false);


  const add = useCallback((line: CartLine) => {
    const current = parse(getSnapshot());
    const existing = current.find((l) => sameLine(l, line));
    write(
      existing
        ? current.map((l) =>
            sameLine(l, line) ? { ...l, quantity: Math.min(l.quantity + line.quantity, MAX_QUANTITY) } : l,
          )
        : [...current, { ...line, quantity: Math.min(line.quantity, MAX_QUANTITY) }],
    );
    setOpen(true);
  }, []);

  const setQuantity = useCallback((line: CartLine, quantity: number) => {
    const current = parse(getSnapshot());
    write(
      quantity <= 0
        ? current.filter((l) => !sameLine(l, line))
        : current.map((l) => (sameLine(l, line) ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY) } : l)),
    );
  }, []);

  const remove = useCallback((line: CartLine) => {
    write(parse(getSnapshot()).filter((l) => !sameLine(l, line)));
  }, []);

  const clear = useCallback(() => write([]), []);

  const value = useMemo<CartContext>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
      open,
      setOpen,
    }),
    [lines, add, setQuantity, remove, clear, open],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCart() {
  const context = useContext(Context);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
