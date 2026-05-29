import Simulator from "./components/Simulator";
import PlanComparison from "./components/PlanComparison";
import TriggerTabs from "./components/TriggerTabs";

export default function Home() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] grid-fade" />

      <Nav />

      <main className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <Hero />

        <Section
          id="simulator"
          eyebrow="See it run"
          title="One prompt, hundreds of agents, one answer"
          lead="Press play. Watch a single request become an orchestration script, fan out across a capped pool of parallel subagents, get cross-checked, and converge into a single report."
        >
          <Simulator />
        </Section>

        <Section
          id="model"
          eyebrow="The mental model"
          title="Who holds the plan?"
          lead="Subagents, skills, and workflows can all run a multi-step task. The real difference is where the plan and the intermediate results live. Pick a column."
        >
          <PlanComparison />
        </Section>

        <Section
          id="lifecycle"
          eyebrow="How a run works"
          title="The plan moves into code"
          lead="The runtime executes the script in an isolated environment, separate from your conversation — which is what makes runs both scalable and resumable."
        >
          <Lifecycle />
        </Section>

        <Section
          id="trigger"
          eyebrow="How to start one"
          title="Four ways to launch a workflow"
          lead="You never write the script yourself — you describe the task and Claude writes it. Here's how to ask."
        >
          <TriggerTabs />
        </Section>

        <Section
          id="limits"
          eyebrow="Good to know"
          title="Limits & behavior"
          lead="The runtime applies a few hard constraints to bound resource use and keep runs safe."
        >
          <Limits />
        </Section>

        <Availability />
      </main>

      <Footer />
    </div>
  );
}

/* --------------------------------- nav ----------------------------------- */

function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border-soft/60 bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/15 text-accent-soft">
            <WorkflowGlyph />
          </span>
          <span className="text-sm font-semibold tracking-tight">Dynamic Workflows</span>
        </div>
        <nav className="ml-auto hidden items-center gap-5 text-sm text-muted sm:flex">
          <a href="#simulator" className="transition hover:text-text">Simulator</a>
          <a href="#model" className="transition hover:text-text">Model</a>
          <a href="#trigger" className="transition hover:text-text">Trigger</a>
        </nav>
        <a
          href="https://code.claude.com/docs/en/workflows"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted transition hover:text-text hover:border-faint"
        >
          Docs ↗
        </a>
      </div>
    </header>
  );
}

/* --------------------------------- hero ---------------------------------- */

function Hero() {
  return (
    <section className="pb-8 pt-16 sm:pt-24 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Research preview · Claude Code v2.1.154+
      </span>
      <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
        Dynamic workflows,
        <br className="hidden sm:block" /> made{" "}
        <span className="bg-gradient-to-r from-accent to-accent-soft bg-clip-text text-transparent">
          intuitive
        </span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted">
        A dynamic workflow is a{" "}
        <span className="text-text">JavaScript script that orchestrates subagents at scale</span>.
        You describe a task; Claude writes the script; a runtime runs it in the background while
        your session stays free.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#simulator"
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-bg transition hover:bg-accent-soft"
        >
          Watch it work ↓
        </a>
        <a
          href="#model"
          className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-muted transition hover:text-text hover:border-faint"
        >
          Skip to the concept
        </a>
      </div>

      <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4">
        <Stat value="16" label="agents run concurrently" />
        <Stat value="1,000" label="agents max per run" />
        <Stat value="1" label="answer reaches your chat" />
      </dl>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface/50 px-3 py-4">
      <div className="bg-gradient-to-b from-text to-muted bg-clip-text font-mono text-3xl font-semibold text-transparent">
        {value}
      </div>
      <div className="mt-1 text-xs leading-tight text-faint">{label}</div>
    </div>
  );
}

/* ------------------------------ lifecycle -------------------------------- */

const STEPS = [
  {
    n: "01",
    title: "Claude plans, then writes a script",
    body: "From your prompt, Claude breaks the task into subtasks and emits a JavaScript orchestration script — the loop, the branching, and the verification, all in code.",
  },
  {
    n: "02",
    title: "An isolated runtime executes it",
    body: "The script runs separately from your conversation. It can't touch the filesystem or shell itself — agents do the reading, writing, and running; the script only coordinates them.",
  },
  {
    n: "03",
    title: "Intermediate results stay in variables",
    body: "Every agent result lives in the script's variables, not Claude's context window. That's the trick that lets a run coordinate hundreds of agents without flooding the chat.",
  },
  {
    n: "04",
    title: "Findings are cross-checked",
    body: "A workflow can apply a quality pattern — independent agents adversarially review each other's findings, or several plans are weighed against each other — so claims that don't hold up are dropped.",
  },
  {
    n: "05",
    title: "One verified answer lands back",
    body: "The runtime tracks each agent's result, so a run is resumable in the same session. When it finishes, only the final report reaches your context.",
  },
];

function Lifecycle() {
  return (
    <ol className="relative space-y-3 border-l border-border-soft pl-6 sm:pl-8">
      {STEPS.map((s) => (
        <li key={s.n} className="relative">
          <span className="absolute -left-[34px] sm:-left-[42px] grid h-7 w-7 place-items-center rounded-full border border-border bg-surface font-mono text-[11px] text-accent-soft">
            {s.n}
          </span>
          <div className="rounded-xl border border-border-soft bg-surface/40 px-5 py-4">
            <h3 className="font-medium text-text">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------- limits --------------------------------- */

const LIMITS = [
  {
    value: "16",
    unit: "concurrent agents",
    body: "At most 16 run at once — fewer on machines with limited CPU cores. Bounds local resource use.",
  },
  {
    value: "1,000",
    unit: "agents per run",
    body: "A hard cap on total agents in a single run, to prevent runaway loops.",
  },
  {
    value: "No",
    unit: "mid-run input",
    body: "Only agent permission prompts can pause a run. For sign-off between stages, run each stage as its own workflow.",
  },
  {
    value: "↺",
    unit: "resumable, in-session",
    body: "Stop and resume in the same session — completed agents return cached results; the rest run live. Exiting Claude Code restarts it fresh.",
  },
  {
    value: "$",
    unit: "more tokens",
    body: "Many agents means a run can use far more tokens than the same task in chat. It counts toward your plan's usage and rate limits.",
  },
  {
    value: "⛨",
    unit: "acceptEdits agents",
    body: "Spawned agents always run in acceptEdits mode and inherit your tool allowlist, regardless of your session's permission mode.",
  },
];

function Limits() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {LIMITS.map((l) => (
        <div
          key={l.unit}
          className="rounded-xl border border-border-soft bg-surface/40 p-5 transition hover:border-border"
        >
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold text-accent-soft">{l.value}</span>
            <span className="text-sm font-medium text-text">{l.unit}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">{l.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- availability ------------------------------ */

function Availability() {
  return (
    <section className="py-16">
      <div className="rounded-2xl border border-border bg-gradient-to-b from-surface/80 to-surface/30 p-6 sm:p-8">
        <h3 className="text-lg font-semibold">Where it's available</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          In research preview on all paid plans (Pro, Max, Team, Enterprise), the Anthropic API,
          Amazon Bedrock, Google Cloud Vertex AI, and Microsoft Foundry — in the CLI, Desktop app,
          IDE extensions, headless <code className="font-mono text-accent-soft">claude -p</code>,
          and the Agent SDK.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MiniCard title="On Pro" body="Enable from the Dynamic workflows row in /config." />
          <MiniCard title="Version" body="Requires Claude Code v2.1.154 or later." />
          <MiniCard title="Org control" body="Admins can disable org-wide in managed settings or the admin settings page." />
        </div>
        <p className="mt-5 text-xs leading-relaxed text-faint">
          Turn off anytime: toggle Dynamic workflows in <code className="font-mono">/config</code>,
          set <code className="font-mono">&quot;disableWorkflows&quot;: true</code> in settings, or
          set <code className="font-mono">CLAUDE_CODE_DISABLE_WORKFLOWS=1</code>.
        </p>
      </div>
    </section>
  );
}

function MiniCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-bg-soft/40 px-4 py-3">
      <div className="text-sm font-medium text-text">{title}</div>
      <div className="mt-0.5 text-xs text-muted">{body}</div>
    </div>
  );
}

/* -------------------------------- footer --------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-border-soft">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-sm">
            <div className="text-sm font-semibold">Dynamic Workflows — an interactive explainer</div>
            <p className="mt-1 text-xs leading-relaxed text-faint">
              An unofficial educational visualization of a Claude Code feature. The simulator&apos;s
              script, agent counts, and findings are illustrative, not a real API. Not affiliated
              with Anthropic.
            </p>
          </div>
          <div className="text-sm">
            <div className="mb-2 font-medium text-muted">Sources</div>
            <ul className="space-y-1.5 text-faint">
              <li>
                <a className="transition hover:text-accent-soft" href="https://code.claude.com/docs/en/workflows" target="_blank" rel="noopener noreferrer">
                  Claude Code Docs — Orchestrate subagents at scale ↗
                </a>
              </li>
              <li>
                <a className="transition hover:text-accent-soft" href="https://claude.com/blog/introducing-dynamic-workflows-in-claude-code" target="_blank" rel="noopener noreferrer">
                  Anthropic — Introducing dynamic workflows ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------- shared --------------------------------- */

function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border-soft/60 py-16">
      <div className="mb-8 max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-3 text-base leading-relaxed text-muted">{lead}</p>
      </div>
      {children}
    </section>
  );
}

function WorkflowGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <circle cx="3" cy="8" r="1.8" />
      <circle cx="12.5" cy="3.5" r="1.6" />
      <circle cx="12.5" cy="12.5" r="1.6" />
      <path d="M4.7 7l6.4-3M4.7 9l6.4 3" strokeLinecap="round" />
    </svg>
  );
}
