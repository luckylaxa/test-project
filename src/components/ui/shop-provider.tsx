"use client";

import { createContext, useContext } from "react";

export type ShopLabels = {
  save: string;
  saved: string;
  add: string;
  chooseShade: string;
  close: string;
  stockOut: string;
  stockLow: string;
};

type Shop = { checkoutEnabled: boolean; currency: string; labels: ShopLabels };

const Context = createContext<Shop | null>(null);

/**
 * The few strings and the one flag that card-level controls need.
 *
 * Cards are rendered by three different server components; threading five
 * labels and a boolean through each call site would mean every future caller
 * has to remember them. This carries them once from the layout, and keeps the
 * wording editable in `/admin` like all other public copy.
 */
export function ShopProvider({ value, children }: { value: Shop; children: React.ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useShop() {
  const context = useContext(Context);
  if (!context) throw new Error("useShop must be used inside ShopProvider");
  return context;
}
