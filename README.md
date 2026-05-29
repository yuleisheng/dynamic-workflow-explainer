# Dynamic Workflows — an interactive explainer

An interactive web page that explains how **dynamic workflows** work in
[Claude Code](https://code.claude.com/docs/en/workflows). The centerpiece is an
animated simulator that walks a single prompt through the whole pipeline:

**Prompt → Plan (script) → Fan-out → Cross-check → Report**

It visualizes the ideas that make dynamic workflows distinct:

- A workflow is a **JavaScript script Claude writes** to orchestrate subagents.
- The runtime fans work out across **≤ 16 concurrent** agents (up to **1,000** per run).
- Intermediate results live in **script variables**, not Claude's context window.
- Findings are **cross-checked** by independent agents before a single report lands back.

Alongside the simulator: an interactive "who holds the plan?" comparison
(subagents vs. skills vs. workflows), a run-lifecycle walkthrough, the four ways
to trigger a workflow, limits, and availability.

> Educational visualization, not affiliated with Anthropic. Numbers and findings
> in the simulator are illustrative. Content sourced from the
> [official docs](https://code.claude.com/docs/en/workflows) and the
> [announcement](https://claude.com/blog/introducing-dynamic-workflows-in-claude-code).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Motion.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deploy

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).
Vercel auto-detects Next.js — no configuration needed.
