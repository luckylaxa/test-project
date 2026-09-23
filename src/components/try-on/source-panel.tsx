"use client";

import Image from "next/image";
import type { TryOnModelRow } from "@/lib/content";

export type SourceMode = "camera" | "upload" | "model";

/**
 * Permission screen and source picker.
 * The camera is only ever requested by an explicit tap, never on page load.
 */
export function PermissionScreen({
  title,
  body,
  startLabel,
  uploadLabel,
  modelLabel,
  models,
  denied,
  deniedMessage,
  onStartCamera,
  onUpload,
  onPickModel,
}: {
  title: string | null;
  body: string | null;
  startLabel: string;
  uploadLabel: string;
  modelLabel: string;
  models: TryOnModelRow[];
  denied: boolean;
  deniedMessage: string;
  onStartCamera: () => void;
  onUpload: (file: File) => void;
  onPickModel: (model: TryOnModelRow) => void;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 py-14 text-center">
      <div className="max-w-md">
        {title ? <h2 className="text-3xl md:text-4xl">{title}</h2> : null}
        {body ? <p className="mt-5 text-sm leading-relaxed text-ink-soft">{body}</p> : null}

        {denied ? (
          <p role="alert" className="mt-6 border border-line px-5 py-4 text-sm text-ink-soft">
            {deniedMessage}
          </p>
        ) : null}

        <div className="mt-9 flex flex-col items-center gap-4">
          {!denied ? (
            <button
              type="button"
              onClick={onStartCamera}
              className="w-full bg-ink px-8 py-4 text-[0.6875rem] tracking-[0.2em] text-canvas uppercase transition-colors duration-500 ease-[var(--ease-editorial)] hover:bg-accent hover:text-ink sm:w-auto"
            >
              {startLabel}
            </button>
          ) : null}

          <label className="w-full cursor-pointer border border-ink/25 px-8 py-3.5 text-[0.6875rem] tracking-[0.2em] uppercase transition-colors duration-500 ease-[var(--ease-editorial)] hover:border-ink hover:bg-ink hover:text-canvas sm:w-auto">
            {uploadLabel}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {models.length > 0 ? (
          <div className="mt-12">
            <p className="eyebrow">{modelLabel}</p>
            <ul className="mt-5 flex justify-center gap-3">
              {models.map((model) => (
                <li key={model.id}>
                  <button
                    type="button"
                    onClick={() => onPickModel(model)}
                    className="relative block h-20 w-16 overflow-hidden bg-canvas-soft opacity-80 ring-1 ring-transparent transition-all duration-300 hover:opacity-100 hover:ring-accent"
                    aria-label={model.name}
                  >
                    {model.photo_url ? (
                      <Image
                        src={model.photo_url}
                        alt={model.photo_alt ?? ""}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Compact source switcher shown once the studio is running. */
export function SourceSwitcher({
  mode,
  models,
  labels,
  onStartCamera,
  onUpload,
  onPickModel,
  tone = "panel",
}: {
  mode: SourceMode | null;
  models: TryOnModelRow[];
  labels: { camera: string; upload: string; models: string };
  onStartCamera: () => void;
  onUpload: (file: File) => void;
  onPickModel: (model: TryOnModelRow) => void;
  /** "over" sits on top of a photograph, where ink on ivory would not read. */
  tone?: "panel" | "over";
}) {
  const over = tone === "over";
  const chip = over
    ? "rounded-full px-3.5 py-2 text-[0.5625rem] tracking-[0.16em] uppercase whitespace-nowrap transition-colors duration-300"
    : "px-4 py-2 text-[0.625rem] tracking-[0.16em] uppercase transition-colors duration-300 border";
  const active = over ? "bg-canvas text-ink" : "border-ink bg-ink text-canvas";
  const idle = over
    ? "bg-canvas/20 text-canvas"
    : "border-ink/20 text-ink-muted hover:border-ink hover:text-ink";

  return (
    <div className={over ? "flex items-center gap-2" : "flex flex-wrap items-center gap-2 lg:flex-nowrap"}>
      <button
        type="button"
        onClick={onStartCamera}
        className={`${chip} ${mode === "camera" ? active : idle}`}
      >
        {labels.camera}
      </button>

      <label className={`${chip} ${mode === "upload" ? active : idle} cursor-pointer`}>
        {labels.upload}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
      </label>

      {models.length > 0 ? (
        <span className="flex items-center gap-2">
          <span className="sr-only">{labels.models}</span>
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => onPickModel(model)}
              aria-label={model.name}
              className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full transition-all duration-300 ${over ? "ring-1 ring-canvas/50" : "ring-1 ring-ink/15 hover:ring-accent"}`}
            >
              {model.photo_url ? (
                <Image
                  src={model.photo_url}
                  alt={model.photo_alt ?? ""}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : null}
            </button>
          ))}
        </span>
      ) : null}
    </div>
  );
}
