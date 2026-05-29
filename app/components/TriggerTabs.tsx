"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Trigger = {
  id: string;
  tab: string;
  command: string;
  highlight?: string;
  title: string;
  body: string;
};

const TRIGGERS: Trigger[] = [
  {
    id: "keyword",
    tab: "The word “workflow”",
    command: "Run a workflow to audit every API endpoint under src/routes/ for missing auth checks",
    highlight: "workflow",
    title: "Drop “workflow” into any prompt",
    body: "Include the word workflow anywhere and Claude writes an orchestration script for that one task instead of working through it turn by turn. Claude Code highlights the word — press alt+w to ignore a false trigger.",
  },
  {
    id: "ultracode",
    tab: "/effort ultracode",
    command: "/effort ultracode",
    title: "Let Claude decide",
    body: "Ultracode pairs xhigh reasoning with automatic orchestration. Claude plans a workflow for every substantive task — one request can become several workflows in a row (understand → change → verify). It lasts for the session; drop back with /effort high.",
  },
  {
    id: "deep-research",
    tab: "/deep-research",
    command: "/deep-research What changed in the Node.js permission model between v20 and v22?",
    title: "Run the bundled workflow",
    body: "/deep-research is built in. It fans web searches across several angles, fetches and cross-checks sources, votes on each claim, and returns a cited report with the claims that didn't survive filtered out. Needs the WebSearch tool enabled.",
  },
  {
    id: "save",
    tab: "Save & reuse",
    command: "/workflows  →  press  s",
    title: "Turn a good run into a command",
    body: "After a run does what you wanted, open /workflows, select it, and press s to save the script to .claude/workflows/ (shared) or ~/.claude/workflows/ (just you). It then runs as /<name> in future sessions.",
  },
];

export default function TriggerTabs() {
  const [active, setActive] = useState(TRIGGERS[0].id);
  const current = TRIGGERS.find((t) => t.id === active)!;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface/60">
      <div className="flex flex-wrap gap-1 border-b border-border-soft bg-bg-soft/50 p-2">
        {TRIGGERS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              t.id === active
                ? "bg-accent text-bg"
                : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {t.tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="p-5 sm:p-6"
        >
          <div className="mb-4 rounded-lg border border-border-soft bg-[#0b0e14] px-4 py-3 font-mono text-sm">
            <span className="select-none text-faint">$ </span>
            {current.highlight ? (
              <CommandWithHighlight text={current.command} word={current.highlight} />
            ) : (
              <span className="text-accent-soft">{current.command}</span>
            )}
          </div>
          <h4 className="text-base font-semibold text-text">{current.title}</h4>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{current.body}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CommandWithHighlight({ text, word }: { text: string; word: string }) {
  const [before, after] = text.split(word);
  return (
    <span className="text-text">
      {before}
      <span className="rounded bg-accent/20 px-1 text-accent-soft">{word}</span>
      {after}
    </span>
  );
}
