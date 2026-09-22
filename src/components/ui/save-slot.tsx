import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SaveButton } from "./save-button";

type Labels = { add: string; remove: string; signIn: string };

/**
 * The save control on an otherwise static page.
 *
 * Whether *you* saved something is per-visitor, and the product page is
 * cached for everyone. Wrapping the session read in Suspense keeps the page
 * static and lets this one control stream in, rather than making the whole
 * page render per request for a single heart.
 */
export function SaveSlot({ productId, labels }: { productId: string; labels: Labels }) {
  return (
    <Suspense fallback={<SaveButton productId={productId} initiallySaved={false} labels={labels} />}>
      <Resolved productId={productId} labels={labels} />
    </Suspense>
  );
}

async function Resolved({ productId, labels }: { productId: string; labels: Labels }) {
  let saved = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      saved = Boolean(data);
    }
  } catch {
    // A signed-out visitor, or a failed read: show it unsaved rather than
    // failing the page over a heart.
  }

  return <SaveButton productId={productId} initiallySaved={saved} labels={labels} />;
}
