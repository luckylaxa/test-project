"use client";

import { useSearchParams } from "next/navigation";

/**
 * The confirmation wording, chosen in the browser so the page itself stays
 * static. A demonstration order must never read like a real one.
 */
export function Completion({
  title,
  body,
  demoTitle,
  demoBody,
}: {
  title: string;
  body: string;
  demoTitle: string;
  demoBody: string;
}) {
  const demo = useSearchParams().get("demo") === "1";

  return (
    <>
      <h1 className="text-4xl md:text-6xl">{demo ? demoTitle : title}</h1>
      <p className="measure mt-6 text-ink-soft">{demo ? demoBody : body}</p>
    </>
  );
}
