"use client";

import { useEffect, useRef } from "react";

const TOOLS = [
  { command: "bold", label: "B", title: "Bold", className: "font-semibold" },
  { command: "italic", label: "I", title: "Italic", className: "italic" },
  { command: "formatBlock:h2", label: "H2", title: "Large heading" },
  { command: "formatBlock:h3", label: "H3", title: "Small heading" },
  { command: "formatBlock:p", label: "¶", title: "Normal paragraph" },
  { command: "insertUnorderedList", label: "•", title: "Bulleted list" },
  { command: "createLink", label: "Link", title: "Add a link" },
  { command: "unlink", label: "Unlink", title: "Remove the link" },
] as const;

/**
 * A deliberately small rich-text editor.
 *
 * The brand team needs paragraphs, two heading levels, emphasis, lists and
 * links — nothing more. Keeping the toolbar this short is what stops journal
 * articles drifting away from the site's typography.
 *
 * It uses document.execCommand, which is formally deprecated but is the only
 * thing every browser still implements for contenteditable, and avoids pulling
 * in an editor dependency for eight buttons.
 */
export function RichText({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Only write into the DOM when the incoming value differs, or typing would
  // reset the caret to the start on every keystroke.
  useEffect(() => {
    const node = ref.current;
    if (node && node.innerHTML !== value) node.innerHTML = value;
  }, [value]);

  const run = (command: string) => {
    const node = ref.current;
    if (!node) return;
    node.focus();

    if (command.startsWith("formatBlock:")) {
      document.execCommand("formatBlock", false, command.split(":")[1]);
    } else if (command === "createLink") {
      const url = window.prompt("Where should this link go?");
      if (url) document.execCommand("createLink", false, url);
    } else {
      document.execCommand(command);
    }
    onChange(node.innerHTML);
  };

  return (
    <div className="space-y-2">
      <label className="block text-[0.6875rem] tracking-[0.14em] uppercase">{label}</label>

      <div className="flex flex-wrap gap-1 border border-line border-b-0 bg-canvas-soft p-1.5">
        {TOOLS.map((tool) => (
          <button
            key={tool.command}
            type="button"
            title={tool.title}
            onClick={() => run(tool.command)}
            className={`min-w-8 px-2 py-1 text-xs transition-colors hover:bg-canvas ${
              "className" in tool ? tool.className : ""
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onBlur={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="prose-editorial min-h-64 border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-accent"
      />

      {help ? <p className="text-xs text-ink-muted">{help}</p> : null}
    </div>
  );
}
