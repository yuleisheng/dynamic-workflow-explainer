"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/* ----------------------------------------------------------------------------
 * The animated simulator: a single prompt fans out into hundreds of parallel
 * subagents, capped at 16 concurrent, then findings are cross-checked before a
 * single report lands back in the session. Numbers/findings are illustrative.
 * -------------------------------------------------------------------------- */

const TOTAL_AGENTS = 248;
const MAX_CONCURRENT = 16;

type Phase = "prompt" | "plan" | "fanout" | "verify" | "report";

// animMs: how long the stage animates. holdMs: how long the finished frame
// "dwells" so it can land before we cross-fade to the next stage.
const PHASES: { id: Phase; label: string; blurb: string; animMs: number; holdMs: number }[] = [
  {
    id: "prompt",
    label: "Prompt",
    blurb: "You describe the task. The word “workflow” tells Claude to orchestrate instead of working turn by turn.",
    animMs: 2600,
    holdMs: 1400,
  },
  {
    id: "plan",
    label: "Plan → script",
    blurb: "Claude writes a JavaScript orchestration script. The plan now lives in code you can read and rerun — not in the chat.",
    animMs: 4200,
    holdMs: 1600,
  },
  {
    id: "fanout",
    label: "Fan-out",
    blurb: "A runtime executes the script in the background, spawning subagents. At most 16 run at once; up to 1,000 total per run.",
    animMs: 6000,
    holdMs: 1700,
  },
  {
    id: "verify",
    label: "Cross-check",
    blurb: "Independent agents try to refute each finding. Claims that don’t survive the adversarial review are filtered out.",
    animMs: 4200,
    holdMs: 2400,
  },
  {
    id: "report",
    label: "Report",
    blurb: "Only the final, verified answer lands in your context — with citations. Intermediate results stayed in script variables.",
    animMs: 2400,
    holdMs: 900,
  },
];

const SCRIPT_LINES = [
  "// workflow.js — written by Claude, run by the runtime",
  "const files = await glob('src/routes/**/*.ts');",
  "",
  "// fan out: one subagent per file (≤ 16 at a time)",
  "const found = await mapAgents(files, (file, agent) =>",
  "  agent.run(`Audit ${file} for missing auth checks`));",
  "",
  "// cross-check: a fresh agent tries to refute each finding",
  "const checked = await mapAgents(found, (f, agent) =>",
  "  agent.run(`Try to refute: ${f.claim}`));",
  "",
  "return report(checked.filter(c => c.survived));",
];

type Finding = {
  file: string;
  claim: string;
  survives: boolean;
  reason: string;
};

const FINDINGS: Finding[] = [
  { file: "src/routes/users.ts:42", claim: "DELETE /users/:id has no auth middleware", survives: true, reason: "confirmed by 2 reviewers" },
  { file: "src/routes/billing.ts:88", claim: "POST /charge skips the role check", survives: true, reason: "reproduced with a viewer token" },
  { file: "src/routes/health.ts:5", claim: "/health is unauthenticated", survives: false, reason: "intended public endpoint" },
  { file: "src/routes/admin.ts:30", claim: "GET /admin/export is unprotected", survives: true, reason: "no session guard found" },
  { file: "src/routes/auth.ts:12", claim: "/login has no rate limit", survives: true, reason: "confirmed, abuse risk" },
  { file: "src/routes/legacy.ts:120", claim: "token check is bypassable", survives: false, reason: "could not reproduce" },
];

const PROMPT_TEXT =
  "Run a workflow to audit every API endpoint under src/routes/ for missing auth checks";

function usePhaseEngine() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 within current phase's animation
  const [playing, setPlaying] = useState(true);
  const [holding, setHolding] = useState(false); // dwelling on a finished frame
  const [done, setDone] = useState(false);

  // refs are the source of truth for the clock so jump/reset apply mid-frame
  const idxRef = useRef(0);
  const progRef = useRef(0);
  const holdRef = useRef(0); // ms accumulated in the current dwell
  const holdingRef = useRef(false);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);

  const goTo = useCallback((idx: number) => {
    idxRef.current = idx;
    progRef.current = 0;
    holdRef.current = 0;
    holdingRef.current = false;
    last.current = null;
    setPhaseIdx(idx);
    setProgress(0);
    setHolding(false);
    setDone(false);
    setPlaying(true);
  }, []);

  const reset = useCallback(() => goTo(0), [goTo]);
  const jump = useCallback((idx: number) => goTo(idx), [goTo]);

  useEffect(() => {
    if (!playing) {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = null;
      return;
    }
    const loop = (t: number) => {
      if (last.current == null) last.current = t;
      const dt = t - last.current;
      last.current = t;
      const phase = PHASES[idxRef.current];

      if (!holdingRef.current) {
        progRef.current = Math.min(1, progRef.current + dt / phase.animMs);
        if (progRef.current >= 1) {
          holdingRef.current = true;
          holdRef.current = 0;
          setHolding(true);
        }
      } else {
        holdRef.current += dt;
        if (holdRef.current >= phase.holdMs) {
          if (idxRef.current < PHASES.length - 1) {
            idxRef.current += 1;
            progRef.current = 0;
            holdRef.current = 0;
            holdingRef.current = false;
            setHolding(false);
            setPhaseIdx(idxRef.current);
          } else {
            setProgress(1);
            setPlaying(false);
            setDone(true);
            return; // finished — stop the loop
          }
        }
      }

      setProgress(progRef.current);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing]);

  return { phaseIdx, progress, playing, holding, done, setPlaying, reset, jump };
}

export default function Simulator() {
  const { phaseIdx, progress, playing, holding, done, setPlaying, reset, jump } = usePhaseEngine();
  const phase = PHASES[phaseIdx];

  return (
    <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
      {/* window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-soft bg-bg-soft/60">
        <span className="h-3 w-3 rounded-full bg-bad/70" />
        <span className="h-3 w-3 rounded-full bg-accent/70" />
        <span className="h-3 w-3 rounded-full bg-good/70" />
        <span className="ml-3 font-mono text-xs text-faint">claude code &mdash; /workflows</span>
      </div>

      <StageRail phaseIdx={phaseIdx} progress={progress} onJump={jump} />

      {/* canvas */}
      <div className="relative min-h-[400px] px-5 py-6 sm:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {phase.id === "prompt" && <PromptStage progress={progress} />}
            {phase.id === "plan" && <PlanStage progress={progress} />}
            {phase.id === "fanout" && <FanoutStage progress={progress} />}
            {phase.id === "verify" && <VerifyStage progress={progress} />}
            {phase.id === "report" && <ReportStage />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* caption + controls */}
      <div className="border-t border-border-soft px-5 py-4 sm:px-8">
        <p className="min-h-[2.5rem] text-sm leading-relaxed text-muted">
          <span className="font-medium text-accent-soft">{phase.label}.</span>{" "}
          {phase.blurb}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => (done ? reset() : setPlaying((p) => !p))}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition hover:bg-accent-soft"
          >
            {done ? <RestartIcon /> : playing ? <PauseIcon /> : <PlayIcon />}
            {done ? "Replay" : playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-muted transition hover:text-text hover:border-faint"
          >
            <RestartIcon /> Restart
          </button>
          <div className="ml-auto flex items-center gap-3">
            {playing && holding && !done && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-accent-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                {phaseIdx < PHASES.length - 1 ? "next step…" : "wrapping up…"}
              </span>
            )}
            <span className="font-mono text-xs text-faint">
              step {phaseIdx + 1}/{PHASES.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- stage rail -------------------------------- */

function StageRail({
  phaseIdx,
  progress,
  onJump,
}: {
  phaseIdx: number;
  progress: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="flex items-stretch gap-1 px-3 py-3 sm:px-6 overflow-x-auto scroll-thin">
      {PHASES.map((p, i) => {
        const state = i < phaseIdx ? "done" : i === phaseIdx ? "active" : "todo";
        return (
          <button
            key={p.id}
            onClick={() => onJump(i)}
            className="group flex min-w-[84px] flex-1 flex-col gap-1.5 text-left"
          >
            <div className="flex items-center gap-2">
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold transition ${
                  state === "done"
                    ? "bg-good/20 text-good"
                    : state === "active"
                      ? "bg-accent text-bg"
                      : "bg-surface-2 text-faint"
                }`}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <span
                className={`whitespace-nowrap text-xs font-medium transition ${
                  state === "todo" ? "text-faint" : "text-text"
                } group-hover:text-accent-soft`}
              >
                {p.label}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-150"
                style={{
                  width:
                    state === "done" ? "100%" : state === "active" ? `${progress * 100}%` : "0%",
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------ stages ----------------------------------- */

function PromptStage({ progress }: { progress: number }) {
  const chars = Math.floor(progress * 1.4 * PROMPT_TEXT.length);
  const shown = PROMPT_TEXT.slice(0, Math.min(chars, PROMPT_TEXT.length));
  const typed = chars >= PROMPT_TEXT.length;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-bg-soft p-4">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">
          your prompt
        </div>
        <p className="font-mono text-sm leading-relaxed text-text">
          {shown.split("workflow")[0]}
          {shown.includes("workflow") && (
            <span className="rounded bg-accent/20 px-1 text-accent-soft">workflow</span>
          )}
          {shown.includes("workflow") ? shown.split("workflow")[1] ?? "" : ""}
          {!typed && <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-accent align-middle" />}
        </p>
      </div>
      <AnimatePresence>
        {typed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 text-sm text-muted"
          >
            <span className="h-2 w-2 rounded-full bg-accent pulse-ring" />
            Claude recognizes the <span className="font-mono text-accent-soft">workflow</span> keyword &mdash; planning an orchestration…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanStage({ progress }: { progress: number }) {
  const totalChars = SCRIPT_LINES.join("\n").length;
  const upto = Math.floor(progress * 1.15 * totalChars);
  let acc = 0;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-xl border border-border bg-[#0b0e14]">
        <div className="flex items-center gap-2 border-b border-border-soft px-4 py-2">
          <span className="font-mono text-[11px] text-script">workflow.js</span>
          <span className="ml-auto font-mono text-[10px] text-faint">generated by Claude</span>
        </div>
        <pre className="scroll-thin max-h-[300px] overflow-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed">
          {SCRIPT_LINES.map((line, i) => {
            const start = acc;
            acc += line.length + 1;
            const visible = upto - start;
            if (visible <= 0) return <div key={i} className="h-[1.45em]" />;
            const text = line.slice(0, visible);
            return (
              <div key={i} className="whitespace-pre">
                <span className="select-none pr-3 text-faint">{String(i + 1).padStart(2, " ")}</span>
                <span className={colorize(text)}>{text}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

function colorize(text: string): string {
  if (text.trimStart().startsWith("//")) return "text-faint italic";
  return "text-[#cdd3df]";
}

function FanoutStage({ progress }: { progress: number }) {
  // ramp the "completed" count up to TOTAL_AGENTS over the phase
  const eased = progress * progress * (3 - 2 * progress); // smoothstep
  const completed = Math.min(TOTAL_AGENTS, Math.floor(eased * TOTAL_AGENTS));
  const remaining = TOTAL_AGENTS - completed;
  const active = Math.min(MAX_CONCURRENT, remaining);
  const queued = Math.max(0, remaining - active);
  const pct = Math.round((completed / TOTAL_AGENTS) * 100);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,260px)]">
      {/* concurrency pool */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wide text-faint">
            concurrency pool
          </span>
          <span className="rounded-md bg-agent/10 px-2 py-0.5 font-mono text-[11px] text-agent-soft">
            {active} / {MAX_CONCURRENT} running
          </span>
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: MAX_CONCURRENT }).map((_, i) => {
            const filled = i < active;
            return (
              <motion.div
                key={i}
                animate={filled ? { opacity: 1, scale: 1 } : { opacity: 0.25, scale: 0.92 }}
                transition={{ duration: 0.25 }}
                className={`relative grid aspect-square place-items-center rounded-md border text-[10px] font-mono ${
                  filled
                    ? "border-agent/50 bg-agent/15 text-agent-soft"
                    : "border-border-soft bg-surface-2 text-faint"
                }`}
              >
                {filled ? (
                  <span className="block h-2.5 w-2.5 animate-spin rounded-full border border-agent-soft border-t-transparent" />
                ) : (
                  <span className="opacity-40">&middot;</span>
                )}
              </motion.div>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-faint">
          The runtime keeps the pool full: as an agent finishes, the next queued task takes its
          slot. The script holds the loop &mdash; results never touch the chat.
        </p>
      </div>

      {/* counters */}
      <div className="flex flex-col gap-3">
        <Counter label="Completed" value={completed} total={TOTAL_AGENTS} color="text-good" />
        <Counter label="Queued" value={queued} color="text-muted" />
        <div>
          <div className="mb-1 flex justify-between font-mono text-[11px] text-faint">
            <span>run progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-agent to-accent transition-[width] duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-right font-mono text-[10px] text-faint">
            cap: 1,000 agents / run
          </div>
        </div>
      </div>
    </div>
  );
}

function Counter({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total?: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border-soft bg-surface-2/60 px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wide text-faint">{label}</div>
      <div className={`font-mono text-xl font-semibold tabular-nums ${color}`}>
        {value.toLocaleString()}
        {total != null && <span className="text-sm text-faint"> / {total}</span>}
      </div>
    </div>
  );
}

function VerifyStage({ progress }: { progress: number }) {
  const revealCount = Math.min(FINDINGS.length, Math.ceil(progress * 1.05 * FINDINGS.length));
  const strikePhase = progress > 0.72;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-faint">
        <span className="h-2 w-2 rounded-full bg-script" />
        adversarial review &mdash; each finding gets a fresh, independent agent
      </div>
      <div className="space-y-2">
        {FINDINGS.slice(0, revealCount).map((f, i) => {
          const filtered = strikePhase && !f.survives;
          return (
            <motion.div
              key={f.file}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition ${
                filtered
                  ? "border-bad/30 bg-bad/5"
                  : strikePhase
                    ? "border-good/30 bg-good/5"
                    : "border-border-soft bg-surface-2/50"
              }`}
            >
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${
                  !strikePhase
                    ? "bg-surface text-faint"
                    : filtered
                      ? "bg-bad/20 text-bad"
                      : "bg-good/20 text-good"
                }`}
              >
                {!strikePhase ? "?" : filtered ? "✗" : "✓"}
              </span>
              <div className="min-w-0">
                <div
                  className={`truncate text-sm ${filtered ? "text-faint line-through" : "text-text"}`}
                >
                  {f.claim}
                </div>
                <div className="font-mono text-[11px] text-faint">
                  {f.file} {strikePhase && <span>&mdash; {f.reason}</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ReportStage() {
  const kept = FINDINGS.filter((f) => f.survives);
  const filtered = FINDINGS.length - kept.length;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-2xl"
    >
      <div className="overflow-hidden rounded-xl border border-good/30 bg-good/5">
        <div className="flex items-center gap-2 border-b border-good/20 px-4 py-2.5">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-good/20 text-good">
            &#10003;
          </span>
          <span className="text-sm font-medium text-text">Auth audit complete</span>
          <span className="ml-auto font-mono text-[11px] text-faint">
            {TOTAL_AGENTS} agents &middot; {filtered} claims filtered
          </span>
        </div>
        <div className="space-y-2.5 px-4 py-4">
          <p className="text-sm text-muted">
            {kept.length} confirmed gaps across <span className="text-text">src/routes/</span>,
            each cross-checked by an independent agent:
          </p>
          {kept.map((f) => (
            <div key={f.file} className="flex items-start gap-2 text-sm">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="text-text">
                {f.claim}{" "}
                <span className="font-mono text-[11px] text-faint">[{f.file}]</span>
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-good/20 bg-bg-soft/40 px-4 py-2.5 text-xs text-faint">
          This single report is all that reaches your context. The {TOTAL_AGENTS} agent results
          and the filtered claims stayed in the script.
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------- icons ----------------------------------- */

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path d="M2 1.5v9l8-4.5z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <rect x="2" y="1.5" width="3" height="9" rx="1" />
      <rect x="7" y="1.5" width="3" height="9" rx="1" />
    </svg>
  );
}
function RestartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" strokeLinecap="round" />
      <path d="M13.5 2v3h-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
