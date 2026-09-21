"use client";

/** Escapes a value for CSV: quotes, commas and newlines all need care. */
function cell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  // A leading =, +, - or @ is treated as a formula by spreadsheet software,
  // so prefix it. A message beginning "=cmd" should never execute on open.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function CsvExport({
  rows,
  columns,
  filename,
  label = "Download as spreadsheet",
}: {
  rows: Record<string, unknown>[];
  columns: { key: string; header: string }[];
  filename: string;
  label?: string;
}) {
  function download() {
    const lines = [
      columns.map((c) => cell(c.header)).join(","),
      ...rows.map((row) => columns.map((c) => cell(row[c.key])).join(",")),
    ];
    // BOM so Excel opens accented characters correctly.
    const blob = new Blob(["﻿" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={rows.length === 0}
      className="border border-line px-5 py-2.5 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 hover:border-ink disabled:opacity-40"
    >
      {label}
    </button>
  );
}
