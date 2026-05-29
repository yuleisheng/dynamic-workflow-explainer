"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";

/* ----------------------------------------------------------------------------
 * The animated simulator: a real finance-research prompt becomes a workflow
 * script, fans out into parallel web-research agents, gets stress-tested by
 * bull/bear agents, and returns one cited brief. The source snippets below are
 * real public examples; the investment verdict remains illustrative.
 * -------------------------------------------------------------------------- */

const TOTAL_AGENTS = 8; // 5 research + 2 debate + 1 synthesis
const RUNTIME_CAP = 16;

type Phase = "prompt" | "plan" | "fanout" | "verify" | "report";

// animMs: how long the stage animates. holdMs: how long the finished frame
// "dwells" so it can land before we cross-fade to the next stage.
const PHASES: { id: Phase; label: string; blurb: string; animMs: number; holdMs: number }[] = [
  {
    id: "prompt",
    label: "Prompt",
    blurb: "You ask for investment research. The word “workflow” tells Claude to orchestrate a multi-agent run instead of answering from one chat turn.",
    animMs: 2600,
    holdMs: 1400,
  },
  {
    id: "plan",
    label: "Plan → script",
    blurb: "Claude writes a JavaScript script with phases, schemas, and parallel agents. The plan now lives in code you can read and rerun.",
    animMs: 4200,
    holdMs: 1600,
  },
  {
    id: "fanout",
    label: "Research fan-out",
    blurb: "Five web-research agents run in parallel across demand, supply/pricing, valuation, analysts, and risks — with the runtime enforcing the 16-agent cap.",
    animMs: 6000,
    holdMs: 1700,
  },
  {
    id: "verify",
    label: "Bull/bear debate",
    blurb: "Two fresh agents argue the strongest bull and bear cases using only the research digest, then flag weak assumptions before synthesis.",
    animMs: 4200,
    holdMs: 2400,
  },
  {
    id: "report",
    label: "Cited brief",
    blurb: "Only the final balanced brief lands in your context — with cited numbers, a watch list, and a not-personalized-advice disclaimer.",
    animMs: 2400,
    holdMs: 900,
  },
];

const SCRIPT_LINES = [
  "export const meta = { name: 'memory-stock-research' };",
  "",
  "const dimensions = ['demand', 'supply_pricing', 'valuation', 'analysts', 'risks'];",
  "const tooling = 'Use WebSearch + WebFetch; cite title, URL, date; no invented numbers.';",
  "",
  "phase('Research');",
  "const research = await parallel(dimensions.map((d) => () =>",
  "  agent(`${tooling} Research ${d} for memory stocks as of mid-2026.`,",
  "    { label: `research:${d}`, schema: RESEARCH_SCHEMA })",
  "));",
  "",
  "const digest = research.map(formatFinding).join('\\n\\n');",
  "phase('Stress-test');",
  "const debate = await parallel(['bull', 'bear'].map((stance) => () =>",
  "  agent(`${stance.toUpperCase()} case using ONLY:\\n${digest}`,",
  "    { label: `debate:${stance}`, schema: DEBATE_SCHEMA })",
  "));",
  "",
  "phase('Synthesize');",
  "return { report: await agent(finalBriefPrompt(digest, debate),",
  "  { label: 'synthesize:report' }) };",
];

type ResearchWorker = {
  key: string;
  label: string;
  focus: string;
  output: string;
};

const RESEARCH_WORKERS: ResearchWorker[] = [
  {
    key: "demand",
    label: "Demand",
    focus: "AI/data-center, HBM, PC/phone refresh, enterprise SSDs",
    output: "AI/HBM is the main bull driver; consumer demand is less decisive.",
  },
  {
    key: "supply_pricing",
    label: "Supply + pricing",
    focus: "DRAM/NAND contract prices, inventories, capex discipline",
    output: "Tight supply and rising contract prices support the upcycle.",
  },
  {
    key: "valuation",
    label: "Valuation",
    focus: "Micron, SK Hynix, Samsung earnings and cycle multiples",
    output: "The stock needs a cycle-aware valuation check, not a simple AI multiple.",
  },
  {
    key: "analysts",
    label: "Analysts",
    focus: "Recent upgrades, downgrades, targets, and named calls",
    output: "Sentiment is bullish but creates risk if revisions stop improving.",
  },
  {
    key: "risks",
    label: "Risks",
    focus: "Oversupply, China competition, geopolitics, customer concentration",
    output: "The bear case is mostly timing, cycle peak, and supply response risk.",
  },
];

type DebateFinding = {
  source: string;
  sourceUrl: string;
  claim: string;
  survives: boolean;
  reason: string;
};

const SOURCE_LINKS = [
  {
    title: "Micron FY2025 results",
    date: "Sep 23, 2025",
    url: "https://investors.micron.com/news-releases/news-release-details/micron-technology-inc-reports-results-fourth-quarter-and-full-8",
  },
  {
    title: "Evertiq / TrendForce DRAM + NAND forecast",
    date: "Jan 5, 2026",
    url: "https://evertiq.com/news/2026-01-05-dram-and-nand-flash-prices-to-surge-in-q1-2026",
  },
  {
    title: "Neumonda memory market 2026 risks",
    date: "Jan 20, 2026",
    url: "https://www.neumonda.com/memory-market-2026-scarcity-strategy-and-security-of-supply/",
  },
];

const DEBATE_FINDINGS: DebateFinding[] = [
  {
    source: "Micron FY2025 results · Sep 23, 2025",
    sourceUrl: SOURCE_LINKS[0].url,
    claim: "Micron reported FY2025 revenue of $37.38B, up from $25.11B in FY2024.",
    survives: true,
    reason: "official company result",
  },
  {
    source: "Evertiq / TrendForce · Jan 5, 2026",
    sourceUrl: SOURCE_LINKS[1].url,
    claim: "TrendForce forecast Q1 2026 conventional DRAM contract prices up 55–60% QoQ.",
    survives: true,
    reason: "specific pricing forecast",
  },
  {
    source: "Evertiq / TrendForce · Jan 5, 2026",
    sourceUrl: SOURCE_LINKS[1].url,
    claim: "NAND Flash prices were forecast to rise 33–38% QoQ in Q1 2026.",
    survives: true,
    reason: "specific pricing forecast",
  },
  {
    source: "Neumonda · Jan 20, 2026",
    sourceUrl: SOURCE_LINKS[2].url,
    claim: "PC and smartphone unit growth alone makes this a broad consumer refresh story.",
    survives: false,
    reason: "source says flat-to-low-single-digit consumer unit growth",
  },
  {
    source: "Neumonda · Jan 20, 2026",
    sourceUrl: SOURCE_LINKS[2].url,
    claim: "Tight supply removes the usual memory-cycle oversupply risk.",
    survives: false,
    reason: "capacity additions, China exposure, and 2027 easing still matter",
  },
  {
    source: "Neumonda · Jan 20, 2026",
    sourceUrl: SOURCE_LINKS[2].url,
    claim: "China-linked supply and export-control exposure remain part of the bear case.",
    survives: true,
    reason: "risk explicitly identified",
  },
];

const PROMPT_TEXT =
  "Run a workflow to research if memory stock is still worth investing";

function usePhaseEngine(speed: number) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 within current phase's animation
  const [playing, setPlaying] = useState(true);
  const [holding, setHolding] = useState(false); // dwelling on a finished frame
  const [done, setDone] = useState(false);

  // refs are the source of truth for the clock so jump/reset/seek apply mid-frame
  const idxRef = useRef(0);
  const progRef = useRef(0);
  const holdRef = useRef(0); // ms accumulated in the current dwell
  const holdingRef = useRef(false);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const speedRef = useRef(speed); // read live in the loop so changes apply mid-run

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

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

  // Seek to an exact position within a step. Preserves the play/pause state so
  // you can pause and scrub to inspect a precise frame.
  const seek = useCallback((idx: number, p: number) => {
    const clamped = Math.max(0, Math.min(1, p));
    idxRef.current = idx;
    progRef.current = clamped;
    holdRef.current = 0;
    holdingRef.current = false;
    last.current = null;
    setPhaseIdx(idx);
    setProgress(clamped);
    setHolding(false);
    setDone(false);
  }, []);

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

      const sdt = dt * speedRef.current; // speed-scaled elapsed time
      if (!holdingRef.current) {
        progRef.current = Math.min(1, progRef.current + sdt / phase.animMs);
        if (progRef.current >= 1) {
          holdingRef.current = true;
          holdRef.current = 0;
          setHolding(true);
        }
      } else {
        holdRef.current += sdt;
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

  return { phaseIdx, progress, playing, holding, done, setPlaying, reset, jump, seek };
}

export default function Simulator() {
  const [speed, setSpeed] = useState(1);
  const { phaseIdx, progress, playing, holding, done, setPlaying, reset, jump, seek } =
    usePhaseEngine(speed);
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

      <StageRail phaseIdx={phaseIdx} progress={progress} onJump={jump} onSeek={seek} />

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
            {phase.id === "verify" && <StressTestStage progress={progress} />}
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

          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-0.5">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`rounded-md px-2 py-1 font-mono text-xs transition ${
                  speed === s ? "bg-accent text-bg" : "text-muted hover:text-text"
                }`}
              >
                {s}&times;
              </button>
            ))}
          </div>

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
  onSeek,
}: {
  phaseIdx: number;
  progress: number;
  onJump: (i: number) => void;
  onSeek: (i: number, p: number) => void;
}) {
  const seekFromEvent = (e: MouseEvent<HTMLDivElement>, i: number) => {
    const r = e.currentTarget.getBoundingClientRect();
    onSeek(i, (e.clientX - r.left) / r.width);
  };

  return (
    <div className="flex items-stretch gap-1 px-3 py-3 sm:px-6 overflow-x-auto scroll-thin">
      {PHASES.map((p, i) => {
        const state = i < phaseIdx ? "done" : i === phaseIdx ? "active" : "todo";
        const fill = state === "done" ? 100 : state === "active" ? progress * 100 : 0;
        return (
          <div key={p.id} className="group flex min-w-[84px] flex-1 flex-col gap-1.5">
            <button
              onClick={() => onJump(i)}
              className="flex items-center gap-2 text-left"
              title={`Jump to ${p.label}`}
            >
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
            </button>
            {/* clickable scrub track — taller hit area than the visible 1.5px bar */}
            <div
              onClick={(e) => seekFromEvent(e, i)}
              className="group/bar -my-1 cursor-pointer py-1"
              title={`Click to seek within ${p.label}`}
            >
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2 transition-colors group-hover/bar:bg-border">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-150"
                  style={{ width: `${fill}%` }}
                />
              </div>
            </div>
          </div>
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
  const visibleLines = SCRIPT_LINES.map((line, i) => {
    const start = SCRIPT_LINES.slice(0, i).reduce((sum, prior) => sum + prior.length + 1, 0);
    const visible = upto - start;
    return { line, visible };
  });
  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-xl border border-border bg-[#0b0e14]">
        <div className="flex items-center gap-2 border-b border-border-soft px-4 py-2">
          <span className="font-mono text-[11px] text-script">workflow.js</span>
          <span className="ml-auto font-mono text-[10px] text-faint">generated by Claude</span>
        </div>
        <pre className="scroll-thin max-h-[300px] overflow-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed">
          {visibleLines.map(({ line, visible }, i) => {
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
  // Ramp completed research dimensions over the phase. In the real script, all
  // five research agents are launched together, then debate/synthesis follow.
  const eased = progress * progress * (3 - 2 * progress); // smoothstep
  const completed = Math.min(
    RESEARCH_WORKERS.length,
    Math.floor(eased * (RESEARCH_WORKERS.length + 0.35)),
  );
  const running = completed === RESEARCH_WORKERS.length ? 0 : RESEARCH_WORKERS.length - completed;
  const pct = Math.round((completed / RESEARCH_WORKERS.length) * 100);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,260px)]">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wide text-faint">
            research dimensions
          </span>
          <span className="rounded-md bg-agent/10 px-2 py-0.5 font-mono text-[11px] text-agent-soft">
            {running} running · cap {RUNTIME_CAP}
          </span>
        </div>
        <div className="space-y-2">
          {RESEARCH_WORKERS.map((worker, i) => {
            const done = i < completed;
            const active = !done && completed < RESEARCH_WORKERS.length;
            return (
              <motion.div
                key={worker.key}
                animate={done ? { opacity: 1, scale: 1 } : { opacity: active ? 0.9 : 0.55, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className={`rounded-lg border px-3 py-2.5 transition ${
                  done
                    ? "border-good/30 bg-good/5"
                    : active
                    ? "border-agent/50 bg-agent/15 text-agent-soft"
                    : "border-border-soft bg-surface-2 text-faint"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${
                      done ? "bg-good/20 text-good" : "bg-agent/20 text-agent-soft"
                    }`}
                  >
                    {done ? "✓" : <span className="h-2.5 w-2.5 animate-spin rounded-full border border-agent-soft border-t-transparent" />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text">{worker.label}</div>
                    <div className="truncate font-mono text-[11px] text-faint">{worker.focus}</div>
                  </div>
                </div>
                {done && <div className="mt-1.5 text-xs text-muted">{worker.output}</div>}
              </motion.div>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-faint">
          Each agent loads web tools, searches recent 2025–2026 sources, and returns structured
          findings. The script stores the digest &mdash; it does not flood the chat with every note.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Counter label="Research done" value={completed} total={RESEARCH_WORKERS.length} color="text-good" />
        <Counter label="Debate + synth next" value={3} color="text-script" />
        <div>
          <div className="mb-1 flex justify-between font-mono text-[11px] text-faint">
            <span>research phase</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-agent to-accent transition-[width] duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-right font-mono text-[10px] text-faint">
            total run: {TOTAL_AGENTS} agents · hard cap: 1,000
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

function StressTestStage({ progress }: { progress: number }) {
  const revealCount = Math.min(
    DEBATE_FINDINGS.length,
    Math.ceil(progress * 1.05 * DEBATE_FINDINGS.length),
  );
  const strikePhase = progress > 0.72;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-faint">
        <span className="h-2 w-2 rounded-full bg-script" />
        bull vs bear &mdash; weak claims get filtered before synthesis
      </div>
      <div className="space-y-2">
        {DEBATE_FINDINGS.slice(0, revealCount).map((f, i) => {
          const filtered = strikePhase && !f.survives;
          return (
            <motion.div
              key={`${f.source}-${f.claim}`}
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
                  {f.source} {strikePhase && <span>&mdash; {f.reason}</span>}
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
  const kept = DEBATE_FINDINGS.filter((f) => f.survives);
  const filtered = DEBATE_FINDINGS.length - kept.length;
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
          <span className="text-sm font-medium text-text">Memory-stock brief complete</span>
          <span className="ml-auto font-mono text-[11px] text-faint">
            {TOTAL_AGENTS} agents &middot; {filtered} claims filtered
          </span>
        </div>
        <div className="space-y-2.5 px-4 py-4">
          <p className="text-sm text-muted">
            Example bottom line: <span className="text-text">selective buy / hold, not a blanket chase</span>.
            The upcycle is real, but the report keeps the cycle and geopolitical risks visible.
          </p>
          {kept.map((f) => (
            <div key={`${f.source}-${f.claim}`} className="flex items-start gap-2 text-sm">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="text-text">
                {f.claim}{" "}
                <a
                  href={f.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-faint transition hover:text-accent-soft"
                >
                  [{f.source}]
                </a>
              </span>
            </div>
          ))}
          <div className="rounded-lg border border-border-soft bg-bg-soft/40 px-3 py-2 text-xs leading-relaxed text-faint">
            Sources:{" "}
            {SOURCE_LINKS.map((source, i) => (
              <span key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-accent-soft"
                >
                  {source.title}, {source.date}
                </a>
                {i < SOURCE_LINKS.length - 1 ? "; " : ""}
              </span>
            ))}
          </div>
          <div className="rounded-lg border border-border-soft bg-bg-soft/40 px-3 py-2 text-xs leading-relaxed text-faint">
            Watch next: HBM sell-through, DRAM/NAND contract pricing, Micron capex, China/export-control headlines, and analyst estimate revisions.
          </div>
        </div>
        <div className="border-t border-good/20 bg-bg-soft/40 px-4 py-2.5 text-xs text-faint">
          This single report is all that reaches your context. The {TOTAL_AGENTS} agent results,
          sources, debate notes, and filtered claims stayed in the script. Research example only;
          not personalized financial advice.
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
