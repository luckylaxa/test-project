"use client";

import { useId } from "react";

/**
 * Form primitives for the admin panel.
 *
 * These are the one place in the project where literal strings are allowed —
 * they are panel chrome, not site content (see CLAUDE.md). They are written for
 * a beauty team, not developers: plain labels, a sentence of help where it
 * earns its place, and counters on anything with a length that matters.
 */

const inputBase =
  "w-full border border-line-strong bg-canvas px-3 py-2.5 text-sm text-ink outline-none " +
  "transition-colors duration-200 placeholder:text-ink-muted/60 placeholder:italic focus:border-accent";

export function Field({
  label,
  help,
  children,
  htmlFor,
  counter,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
  htmlFor?: string;
  counter?: { value: number; max: number };
}) {
  const over = counter ? counter.value > counter.max : false;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[0.6875rem] tracking-[0.14em] uppercase">
          {label}
        </label>
        {counter ? (
          <span
            className={`text-[0.6875rem] tabular-nums ${over ? "text-red-700" : "text-ink-muted"}`}
          >
            {counter.value}/{counter.max}
          </span>
        ) : null}
      </div>
      {children}
      {help ? <p className="text-xs leading-relaxed text-ink-muted">{help}</p> : null}
    </div>
  );
}

export function TextInput({
  label,
  help,
  value,
  onChange,
  max,
  placeholder,
  type = "text",
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  max?: number;
  placeholder?: string;
  type?: string;
}) {
  const id = useId();
  return (
    <Field
      label={label}
      help={help}
      htmlFor={id}
      counter={max ? { value: value.length, max } : undefined}
    >
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
      />
    </Field>
  );
}

export function TextArea({
  label,
  help,
  value,
  onChange,
  max,
  rows = 4,
  placeholder,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  max?: number;
  rows?: number;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <Field
      label={label}
      help={help}
      htmlFor={id}
      counter={max ? { value: value.length, max } : undefined}
    >
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} resize-y leading-relaxed`}
      />
    </Field>
  );
}

export function Select({
  label,
  help,
  value,
  onChange,
  options,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <Field label={label} help={help} htmlFor={id}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputBase}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-[0.6875rem] tracking-[0.14em] uppercase">
          {label}
        </label>
        {help ? <p className="mt-1 text-xs text-ink-muted">{help}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? "bg-accent" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-canvas shadow-sm transition-all duration-300 ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  suffix = "%",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.6875rem] tracking-[0.14em] uppercase">
          {label}
        </label>
        <span className="text-[0.6875rem] tabular-nums text-ink-muted">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-[var(--accent)]"
      />
    </div>
  );
}

export function ColorField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const valid = /^#[0-9A-Fa-f]{6}$/.test(value);
  return (
    <Field label={label} help={help} htmlFor={id}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={`${label} colour picker`}
          value={valid ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 shrink-0 cursor-pointer border border-line bg-canvas p-1"
        />
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          spellCheck={false}
          className={`${inputBase} font-mono ${valid ? "" : "border-red-600"}`}
        />
      </div>
      {!valid ? (
        <p className="text-xs text-red-700">Use a six-digit hex colour, like #C2A36B.</p>
      ) : null}
    </Field>
  );
}
