# Test and Docs

Two agents for the work that comes after the code exists: `test-writer` pins one
stated behavior with a test it actually runs, and `doc-writer` documents an
implemented feature with a Mermaid diagram and files it where your project keeps
its docs. Install it if you want tests and docs written to the project's own
conventions instead of generic boilerplate. Both discover the project (test
runner, helpers, docs layout, agent map) rather than assuming a stack.

## Agents

| Agent | Use it to | Never does |
| :- | :- | :- |
| `test-writer` | Write a test for a named behavior or edge case; reproduce a reported bug as a failing test first; back-fill tests for an untested file | Change production code; skip, weaken or delete an existing test; write browser end-to-end flows |
| `doc-writer` | Document a feature that is already implemented, from a plan, an implementation report or the code | Write a spec or a plan; document unimplemented work; touch agent/skill tooling or mirrored product artifacts |

### `test-writer`

- Asks first (and writes nothing) when the behavior to pin is not stated.
- Reads `AGENTS.md` / `CLAUDE.md`, finds the runner and commands from the
  project's scripts and CI, reads neighbouring tests and reuses existing helpers
  and mocks instead of adding new ones.
- Routes to `engineering-paved-path` skills by what the test touches (React
  Testing Library, Next.js, architecture seams, Fastify, Zod, TypeScript).
- Runs the test it wrote and reports the verbatim result, including a clear
  statement when a suite was skipped. A red test is reported red.
- When the code under test must change, it describes the change under "For the
  code owner" and leaves the code alone.

### `doc-writer`

- Documents only what is implemented; anything else goes under "Not documented".
- `engineering-paved-path:mermaid-diagram` is preloaded, so every deliverable has
  a diagram that matches the project's existing diagram style.
- Discovers the docs layout (`docs/`, package READMEs, dated write-up folders),
  prefers updating a neighbouring doc to adding a file, and adds the "Read when"
  link in the project's `AGENTS.md` / `CLAUDE.md` when one exists.
- Classifies each document (tutorial, how-to, reference, explanation, or a
  declared fallback for READMEs and dated records) and keeps the types separate.
- Its report lists the skills applied, the evidence (`path:line`) behind each
  claim, stale docs it found, and what it left out.

## How they fit with `sdd-engineering`

`sdd-engineering`'s `run-plan` has **no test-writer step**: implementers write
the tests for each acceptance criterion as they go. Use `test-writer` for what
that flow does not cover:

- **Back-filling** tests for code that predates the plan or was left untested.
- **Bug reproduction**: a failing test first, then hand the fix to an implementer.

`doc-writer` runs **after a plan is verified** (the Verify step of the SDD loop),
using the plan or the Implementation Report as input. It never writes specs or
plans; those stay with `sdd-engineering:spec-creator` and
`sdd-engineering:implementation-planner`.

Both agents are launched by the main session; neither can launch other agents.
They do not commit, push or open pull requests.

## Dependencies

Declared in `plugin.json` and installed automatically:

- `engineering-paved-path` `^1.0.0` — the skills the agents route to and preload.

## Usage

Ask in plain language, giving a target and the behavior or feature:

```text
Use test-writer: src/lib/price.ts, the rounding when the discount is exactly 100%
Use test-writer: reproduce the bug where the cart total ignores removed items
Use doc-writer: document the notification preferences feature, plan is docs/plans/2026-10-20-notifications.md
```

## Limits

- Neither agent has web access.
- `doc-writer`'s shell use is read-only by prompt only; the harness does not
  enforce it.
- `test-writer` can only report a test as passing for the commands it ran; a
  suite that needs Docker or a database may be skipped locally, and it says so.
