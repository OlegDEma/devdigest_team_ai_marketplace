# Engineering Paved Path

Reusable engineering knowledge packaged as Claude Code skills: a stack-neutral
layered **architecture** skill (onion / hexagonal rules for backends plus
frontend layering rules) and best-practice skills for React, Next.js, Fastify,
React Testing Library, application security, TypeScript, Zod and Mermaid
diagrams. Install it if you want Claude to design, implement and review code
against consistent, well-sourced conventions, or if you build agents and
plugins that should apply the same rules (the `architecture-review` and
`sdd-engineering` plugins depend on it). It ships skills only: no agents, no
hooks, no commands that run on their own.

## Install

```bash
claude plugin install engineering-paved-path@dev-digest-ai-marketplace
```

No dependencies. It is pulled in automatically when you install
`architecture-review` or `sdd-engineering`.

## What's inside

| Skill | Invocation | Purpose |
| --- | --- | --- |
| `architecture` | `/engineering-paved-path:architecture` | Stack-neutral layering rules (A1–A7 backend/core, F1–F9 frontend) as design guidance and review criteria, applied through the project's own layer map. |
| `react-best-practices` | `/engineering-paved-path:react-best-practices` | Modern React rules and anti-pattern catalog with severity tags (component design, derived state, hooks, keys, data fetching, accessibility). |
| `next-best-practices` | `/engineering-paved-path:next-best-practices` | Next.js App Router conventions: file conventions, RSC boundaries, data patterns, async APIs, metadata, errors, route handlers, images, fonts, bundling, self-hosting. |
| `fastify-best-practices` | `/engineering-paved-path:fastify-best-practices` | Fastify plugins, routes, JSON Schema, hooks, auth, error handling, testing with `inject()`, performance, logging, deployment. |
| `react-testing-library` | `/engineering-paved-path:react-testing-library` | Fewer, longer, user-flow tests with React Testing Library + Vitest; query priority, `userEvent`, async patterns, MSW mocking. |
| `security` | `/engineering-paved-path:security` | OWASP Top 10:2025 guidance with confidence-based reporting, checklists and unsafe/safe code pairs. |
| `typescript-expert` | `/engineering-paved-path:typescript-expert` | Advanced types, tsconfig, type-check performance, ESM/CJS and migration help, plus a diagnostic script. |
| `zod` | `/engineering-paved-path:zod` | 43 prioritized Zod rules: schemas, `safeParse`, inference, errors, objects, composition, refinements, performance. |
| `mermaid-diagram` | `/engineering-paved-path:mermaid-diagram` | Choose the right Mermaid diagram type and write it clearly (flowchart, sequence, class, ER, state, Gantt, and more). |

### When each skill triggers

Claude loads a skill automatically when the task matches its description; you
can also call it explicitly with the slash command above.

- **architecture** — adding a route, handler, service, repository, adapter,
  page, feature, component or hook; "where should this go?"; a route that
  touches the database; a service that creates an SDK client; business logic or
  data fetching inside components; reviewing a plan or working tree for
  layering violations.
- **react-best-practices** — writing, reviewing or refactoring React
  components, hooks and state.
- **next-best-practices** — writing or reviewing Next.js (App Router) code,
  debugging hydration errors, RSC boundaries, metadata, caching or self-hosting.
- **fastify-best-practices** — building or debugging a Fastify server or REST
  API.
- **react-testing-library** — writing, reviewing or setting up React component
  and hook tests.
- **security** — reviewing code for vulnerabilities, implementing auth,
  handling user input or uploads, managing secrets, building API endpoints.
- **typescript-expert** — complex type errors, generics and type-level work,
  tsconfig and build performance, JavaScript-to-TypeScript or ESM/CJS
  migration.
- **zod** — defining schemas, `safeParse`, `z.infer`, validation errors,
  transforms and refinements.
- **mermaid-diagram** — visualizing workflows, architectures, API flows, data
  models or state machines in Markdown.

## How to use

**1. Decide where new code belongs**

```text
/engineering-paved-path:architecture We need to send a receipt email after an
order is paid. Where do the email call, the "paid" rule and the DB update go?
```

Expected output: the layer map it used (and its source: your `CLAUDE.md` /
`AGENTS.md`, the plan, or an inferred map it asks you to confirm), then a
placement per piece — for example "paid" rule in the domain, a `Mailer` port
with an adapter wired at the composition root, the update in a repository,
orchestration in the orders service — each tied to a rule ID (A1–A7).

**2. Review a working tree for layering violations**

```text
Use /engineering-paved-path:architecture to review src/modules/orders/** and
web/src/features/checkout/** against our layer map in CLAUDE.md.
```

Expected output: findings in the shape
`[CRITICAL|WARNING|SUGGESTION] <rule ID> <title>` with quoted evidence as
`path:line`, the layer-map entry that makes it a violation, the mechanism, and
where the code belongs; then the rules that held and any pre-existing
deviations. An empty findings list is a valid result.

**3. Review a component or endpoint for security**

```text
/engineering-paved-path:security Review src/routes/upload.ts for vulnerabilities.
```

Expected output: only HIGH-confidence issues, each with file, line, exploit
scenario and a specific fix, grouped by OWASP category.

**4. Write tests the way users use the UI**

```text
/engineering-paved-path:react-testing-library Write tests for CheckoutForm.tsx.
```

Expected output: one to three user-flow tests (render, interact with
`userEvent`, assert on accessible queries) with network calls mocked at the
boundary (MSW), plus setup steps if Vitest is not configured yet.

## Inputs and conventions

- **Layer map (architecture).** The architecture skill never assumes folder
  names. It resolves the project's layer map in this order: the caller's prompt
  or the plan; the project's conventions file if one exists (`CLAUDE.md`,
  `AGENTS.md`, or an architecture doc / ADR they point to) and any
  import-boundary checker config (dependency-cruiser, eslint-plugin-boundaries,
  import-linter, ArchUnit); otherwise it infers a map from the repository and
  asks you to confirm it. A template is in
  `skills/architecture/references/rules.md`; a worked example (a generic Node.js
  backend + React frontend, marked as an example) is in
  `skills/architecture/references/example-layer-map.md`. Writing your layer map
  and known deviations into `CLAUDE.md` or `AGENTS.md` makes every run
  consistent.
- **Project conventions win.** Every skill adapts to conventions already
  present in the repository (import style, test runner, folder layout) and
  defers to the project's documented choices unless they break a rule outright.
- **Commands.** Where a skill validates its work it uses the project's own
  build, typecheck and test commands as found in the repository (`package.json`
  scripts, `Makefile`, and so on), falling back to `npx tsc --noEmit` /
  `npx vitest run`.
- **Bundled files** are referenced inside skills via `${CLAUDE_SKILL_DIR}`, so
  they work wherever the plugin is installed.

## Using these skills from other plugins

Skills in this plugin are namespaced as `engineering-paved-path:<skill>`.

- **From a skill or the main session**, call one with the `Skill` tool and the
  namespaced name, for example `Skill(skill: "engineering-paved-path:architecture")`
  or `Skill(skill: "engineering-paved-path:security")`.
- **From an agent**, preload skills in its frontmatter so their content is in
  context from the first turn:

  ```yaml
  ---
  name: architecture-reviewer
  description: Read-only architecture review against the project's layer map
  tools: Read, Grep, Glob, Skill
  skills: engineering-paved-path:architecture
  ---
  ```

  Several skills are a comma-separated list
  (`skills: engineering-paved-path:architecture, engineering-paved-path:security`).
  Keep `Skill` in the agent's `tools` if it should load further skills on
  demand (for example the frontend references of `architecture`).
- **Declare the dependency** in your plugin's `.claude-plugin/plugin.json` so
  installing your plugin installs this one:

  ```json
  "dependencies": [{ "name": "engineering-paved-path", "version": "^1.0.0" }]
  ```

- **Cite rule IDs.** The architecture rule IDs (A1–A7, F1–F9) and the severity
  vocabulary `CRITICAL | WARNING | SUGGESTION` are stable within a major
  version, so plans and review reports can reference them.

Current consumers: `architecture-review:architecture-reviewer` preloads
`engineering-paved-path:architecture`; `sdd-engineering`'s
`implementation-planner` and `implementer` name a skill from this plugin for
every plan step, and `spec-creator` uses `mermaid-diagram` and `security`.

## Requirements and limits

- Skills only: they add knowledge and procedures, they do not grant tools. What
  Claude can do (read-only or writing) depends on the agent or session that
  loads them.
- `typescript-expert` ships `scripts/ts_diagnostic.py`, which needs `python3`
  and `npx` on your machine. No other skill runs scripts.
- `react-testing-library` targets Vitest + React Testing Library (Vite-based or
  any setup that can run Vitest); `security` examples use React, Express,
  MongoDB and JWT, but the guidance applies to other stacks.
- Skill content reflects the state of each library in 2025–2026 (React 19,
  Next.js 16, Zod 4, TypeScript 5.x). Verify version-specific
  details against the official docs for older or newer versions.
- The architecture skill does not install a boundary checker. It can plan one
  and review against one that exists.

## Related plugins

- **Depends on:** nothing.
- **Used by:** `architecture-review` (agent `architecture-reviewer` preloads
  `engineering-paved-path:architecture`) and `sdd-engineering` (planner,
  implementer and spec-creator use these skills).

## Credits

- Authored and packaged by DevDigest AI Engineering.
- `fastify-best-practices` — upstream `mcollina/fastify-best-practices`
  (Matteo Collina), version 0.1.0; attribution kept in
  `skills/fastify-best-practices/tile.json`.
- `next-best-practices` — upstream Vercel `next-skills` (`vercel-labs/next-skills`).
- `typescript-expert` — community skill (frontmatter `metadata.source: community`,
  added 2026-02-27).
- `zod` — community rule set ("Zod", version 1.0.0, January 2026; see
  `skills/zod/AGENTS.md`), based on the official Zod documentation
  (colinhacks/zod).
- `security` — synthesized from OWASP Top 10:2025 and ASVS 5.0 and from
  community skills including getsentry/skills (security-review),
  agamm/claude-code-owasp and trailofbits/skills; full list in
  `skills/security/references.md`.
- `react-testing-library` — rewrite informed by Kent C. Dodds' testing writing,
  the Testing Library docs and MSW; sources in
  `skills/react-testing-library/README.md`.
- `architecture` — generalized from Onion / Hexagonal / Clean-architecture
  literature (Palermo, Cockburn, Seemann, Allegro Tech and others) and from
  bulletproof-react, Feature-Sliced Design, react.dev and the Next.js docs;
  full reading list in `skills/architecture/references/sources.md`.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
