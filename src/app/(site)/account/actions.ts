"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/content";
import { makeLabels } from "@/lib/labels";

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
  const [supabase, settings] = await Promise.all([createClient(), getSiteSettings()]);
  const labels = makeLabels(settings);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: labels.t("account_error_signed_out") };

  const country = details.country.trim().toUpperCase();
  if (country && !/^[A-Z]{2}$/.test(country)) {
    return { ok: false, error: labels.t("account_error_country") };
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

  // The database's own wording is not the customer's to read, and would not
  // be editable if it were.
  if (error) return { ok: false, error: labels.t("form_error_save") };
  return { ok: true };
}

export async function signOutCustomer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
