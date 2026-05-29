"use client";

import { useState } from "react";
import { motion } from "motion/react";

/* Interactive version of the docs' "who holds the plan" table. Pick a column
 * to focus it; the takeaway updates to explain that approach. */

type Col = "subagents" | "skills" | "workflows";

const COLS: { id: Col; label: string; tag: string }[] = [
  { id: "subagents", label: "Subagents", tag: "a worker Claude spawns" },
  { id: "skills", label: "Skills", tag: "instructions Claude follows" },
  { id: "workflows", label: "Workflows", tag: "a script the runtime executes" },
];

const ROWS: { label: string; cells: Record<Col, string> }[] = [
  {
    label: "Who decides what runs next",
    cells: {
      subagents: "Claude, turn by turn",
      skills: "Claude, following the prompt",
      workflows: "The script",
    },
  },
  {
    label: "Where intermediate results live",
    cells: {
      subagents: "Claude's context window",
      skills: "Claude's context window",
      workflows: "Script variables",
    },
  },
  {
    label: "What's repeatable",
    cells: {
      subagents: "The worker definition",
      skills: "The instructions",
      workflows: "The orchestration itself",
    },
  },
  {
    label: "Scale",
    cells: {
      subagents: "A few delegated tasks per turn",
      skills: "Same as subagents",
      workflows: "Dozens to hundreds of agents per run",
    },
  },
  {
    label: "Interruption",
    cells: {
      subagents: "Restarts the turn",
      skills: "Restarts the turn",
      workflows: "Resumable in the same session",
    },
  },
];

const TAKEAWAY: Record<Col, string> = {
  subagents:
    "Claude is the orchestrator. It decides turn by turn what to spawn, and every result lands back in its context — great for a handful of delegated tasks.",
  skills:
    "A skill is a reusable set of instructions Claude follows. Like subagents, Claude still holds the plan and the results in its context window.",
  workflows:
    "A workflow moves the plan into code. The script holds the loop, the branching, and the intermediate results — so Claude's context only ever holds the final answer. That's what lets it scale to hundreds of agents.",
};

export default function PlanComparison() {
  const [active, setActive] = useState<Col>("workflows");

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface/60">
        <div className="grid grid-cols-[1.1fr_repeat(3,1fr)] text-sm">
          {/* header */}
          <div className="border-b border-border-soft bg-bg-soft/50 px-4 py-3" />
          {COLS.map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`border-b border-l border-border-soft px-4 py-3 text-left transition ${
                  on ? "bg-accent/10" : "bg-bg-soft/50 hover:bg-surface-2"
                }`}
              >
                <div className={`font-semibold ${on ? "text-accent-soft" : "text-text"}`}>
                  {c.label}
                </div>
                <div className="mt-0.5 text-[11px] leading-tight text-faint">{c.tag}</div>
              </button>
            );
          })}

          {/* rows */}
          {ROWS.map((row, ri) => (
            <div key={row.label} className="contents">
              <div
                className={`px-4 py-3 text-muted ${
                  ri < ROWS.length - 1 ? "border-b border-border-soft" : ""
                }`}
              >
                {row.label}
              </div>
              {COLS.map((c) => {
                const on = c.id === active;
                return (
                  <div
                    key={c.id}
                    className={`border-l border-border-soft px-4 py-3 transition ${
                      ri < ROWS.length - 1 ? "border-b" : ""
                    } ${on ? "bg-accent/[0.06] text-text" : "text-muted"}`}
                  >
                    {row.cells[c.id]}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <motion.div
        key={active}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-xl border border-border-soft bg-surface-2/40 px-5 py-4 text-sm leading-relaxed text-muted"
      >
        <span className="font-medium text-accent-soft">{COLS.find((c) => c.id === active)!.label}:</span>{" "}
        {TAKEAWAY[active]}
      </motion.div>
    </div>
  );
}
