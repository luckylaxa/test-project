"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Saves the customer's delivery details.
 *
 * `user_id` comes from the session, never from the form — otherwise anyone
 * could write to somebody else's record. RLS enforces the same rule a second
 * time at the database.
 */
export async function saveCustomer(details: {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
}): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Please sign in again." };

  const country = details.country.trim().toUpperCase();
  if (country && !/^[A-Z]{2}$/.test(country)) {
    return { ok: false, error: "Please choose a country." };
  }

  const { error } = await supabase.from("customers").upsert(
    {
      user_id: user.id,
      email: user.email ?? "",
      full_name: details.full_name.trim() || null,
      phone: details.phone.trim() || null,
      address_line1: details.address_line1.trim() || null,
      address_line2: details.address_line2.trim() || null,
      city: details.city.trim() || null,
      postal_code: details.postal_code.trim() || null,
      country: country || null,
    },
    { onConflict: "user_id" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOutCustomer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
