"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "./fields";

export type MediaValue = { url: string; alt: string };

const BUCKET = "site-media";

/**
 * Upload an image or video to Supabase storage and keep its alt text beside it.
 *
 * Alt text is required, not optional: an image saved without it is an
 * accessibility hole on a public page, and the team should not have to know
 * that to do the right thing.
 */
export function MediaField({
  label,
  help,
  value,
  onChange,
  accept = "image/*",
  altRequired = true,
}: {
  label: string;
  help?: string;
  value: MediaValue;
  onChange: (value: MediaValue) => void;
  accept?: string;
  altRequired?: boolean;
}) {
  const id = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVideo = /\.(mp4|webm)$/i.test(value.url);
  const missingAlt = altRequired && Boolean(value.url) && value.alt.trim() === "";

  async function upload(file: File) {
    setUploading(true);
    setError(null);

    const supabase = createClient();
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    // Random name: two editors uploading "hero.jpg" must not overwrite each other.
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "31536000", upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    onChange({ url: data.publicUrl, alt: value.alt });
    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <Field label={label} help={help}>
        <div className="flex items-start gap-4">
          <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-line bg-canvas-soft">
            {value.url ? (
              isVideo ? (
                <video src={value.url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <Image
                  src={value.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized={value.url.endsWith(".svg")}
                />
              )
            ) : (
              <span className="flex h-full items-center justify-center px-2 text-center text-[0.625rem] text-ink-muted">
                No image
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <label className="inline-block cursor-pointer border border-line px-4 py-2 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink">
              {uploading ? "Uploading…" : value.url ? "Replace" : "Upload"}
              <input
                type="file"
                accept={accept}
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                  e.target.value = "";
                }}
              />
            </label>

            {value.url ? (
              <button
                type="button"
                onClick={() => onChange({ url: "", alt: "" })}
                className="ml-3 text-[0.6875rem] tracking-[0.16em] text-ink-muted uppercase transition-colors duration-300 hover:text-ink"
              >
                Remove
              </button>
            ) : null}

            {error ? <p className="text-xs text-red-700">{error}</p> : null}
          </div>
        </div>
      </Field>

      {value.url ? (
        <div className="space-y-1.5">
          <label htmlFor={id} className="text-[0.6875rem] tracking-[0.14em] uppercase">
            Describe this image
          </label>
          <input
            id={id}
            value={value.alt}
            placeholder="A model wearing a deep red lip in daylight"
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            className={`w-full border bg-canvas px-3 py-2.5 text-sm outline-none transition-colors duration-200 placeholder:text-ink-muted focus:border-accent ${
              missingAlt ? "border-red-600" : "border-line"
            }`}
          />
          <p className={`text-xs ${missingAlt ? "text-red-700" : "text-ink-muted"}`}>
            {missingAlt
              ? "Please describe the image — screen readers and search engines rely on it."
              : "One short sentence describing what is in the picture."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
