# Architecture Review

A read-only Claude Code agent that checks whether code, or a plan for code, respects your project's layering: dependencies point inward, the persistence library stays in the data-access layer, external I/O goes through ports, input is validated at the edge, orchestration lives in the application layer, and frontend code follows its module and server-client boundaries. It returns a verdict (`approve`, `request_changes` or `comment`) with quoted `path:line` evidence, and it works **before** a PR exists: on a plan, on a working tree mid-implementation, or on a named file list. Install it if you want a second pair of eyes on architecture without giving that reviewer any way to change your code. It is also the review agent the `sdd-engineering` workflow runs after implementation.

## Install

```bash
claude plugin install architecture-review@dev-digest-ai-marketplace
```

This also installs its dependency **`engineering-paved-path`** (`^1.0.0`), which provides the `engineering-paved-path:architecture` skill the agent preloads. Without it the agent would review with no architecture rules.

## What's inside

| Component | Invocation | Purpose |
| :- | :- | :- |
| Agent `architecture-reviewer` | `@agent-architecture-review:architecture-reviewer` in chat, or `subagent_type: "architecture-review:architecture-reviewer"` from a skill or the main session | Read-only architectural verdict with `path:line` evidence on a plan, a working tree or a file list, judged against the project's layer map |

## How to use

### 1. Review a plan before you approve it

```text
@agent-architecture-review:architecture-reviewer Review docs/plans/2026-10-20-export-reports.md
for layer correctness. Layer map is in CLAUDE.md under "Architecture".
```

The agent reads the plan's code map, checks which layer each new file lands in, which ports are added, and where validation and orchestration go. Catching a misplaced database query in a plan is cheaper than catching it in code.

### 2. Review a working tree mid-implementation

```text
@agent-architecture-review:architecture-reviewer Review the current state of src/modules/billing/
(work in progress, no PR yet). Intent: add invoice retries.
Here is the diff so far: <paste `git diff` output>
```

The agent has no shell, so it cannot run `git diff` itself. Paste the diff (or name the changed files) when "what this change introduced" matters; otherwise it reviews the files as they are and lists history under **Not verified**.

### 3. Review a named file list

```text
@agent-architecture-review:architecture-reviewer Lite review of these files only:
src/api/orders/routes.ts, src/app/orders/service.ts, src/data/orders.repo.ts.
Known deviation: src/api/legacy/ queries the DB directly; do not report it.
```

In lite mode it reviews only the named files and lists everything else under **Scope & limits** as "not reviewed".

### From a skill or the main session

```text
Agent(subagent_type: "architecture-review:architecture-reviewer",
      prompt: "Review plan docs/plans/2026-10-20-export-reports.md. Layer map: ...")
```

Always pass the full namespaced `subagent_type`; other plugins may ship an agent with the same short name.

### Example verdict (abridged)

```markdown
# Architecture verdict: src/modules/billing/

**Verdict:** request_changes
One CRITICAL: the route queries the database directly, bypassing the repository layer.

## Findings
### AR-1 — CRITICAL — The invoices route imports the ORM and queries the invoices table
- Rule: Persistence confinement
- Evidence: `src/modules/billing/routes.ts:14`
  ```
  const rows = await db.select().from(invoices).where(eq(invoices.status, "failed"));
  ```
- Mechanism: every retry request bypasses the repository, so the tenant filter in `invoices.repo.ts:22` is skipped.
- Where it belongs: a `findFailed(tenantId)` method in `src/modules/billing/invoices.repo.ts`.

### AR-2 — WARNING — The service constructs a payment SDK client directly
- Rule: External I/O
- Evidence: `src/modules/billing/service.ts:8`
- Mechanism: the client cannot be replaced in tests; retries hit the real provider.
- Where it belongs: a payments port wired in the composition root.

## Checked and clean
- Direction: the domain folder imports nothing outward.
- Validation at the edge: the route declares body and response schemas.

## Pre-existing, not introduced here
- `src/modules/legacy/routes.ts` queries the DB directly (listed in CLAUDE.md, "Known deviations").

## Not verified
- Whether AR-1 was introduced by this change: no diff was pasted.

## Scope & limits
Layer map from CLAUDE.md. Files read: 6. No boundary-check tool configured.
```

## Inputs and conventions

**Target** (one of):

- a plan file — default location `docs/plans/YYYY-MM-DD-slug.md`, unless you or the project's conventions name another location;
- a working tree, optionally narrowed to a folder, package or module;
- a named file list;
- pasted diff text.

**Your layer map.** The agent judges against *your* layers, not a template. It looks for the map in this order and says which source it used:

1. your prompt or the plan (a layer table or a code map);
2. the project's conventions file, if one exists (`CLAUDE.md`, `AGENTS.md`, or an architecture doc they point to);
3. inferred from the repository (folder names, where the ORM and the HTTP framework are imported). An inferred map is stated in the report as an **assumption**, and findings that rest only on it are capped at WARNING.

The quickest way to get precise verdicts is a short section in `CLAUDE.md` or `AGENTS.md`:

```markdown
## Architecture
| Layer | Paths | May import | Must not import |
| --- | --- | --- | --- |
| Domain | src/domain/ | nothing outward | ORM, HTTP framework, adapters |
| Application | src/app/*/service.ts | domain, ports | HTTP request objects, SDK clients |
| Data access | src/data/*.repo.ts | ORM, domain types | HTTP framework, services |
| Infrastructure | src/adapters/, src/di.ts | anything inward | — |
| Presentation | src/api/*/routes.ts | its service, schemas | ORM |

Known deviations (do not report unless worsened): src/api/legacy/ queries the DB directly.
```

**Optional:** the change's intent in one sentence, and a list of known deviations. The agent works without them and says when their absence limited the verdict.

**Output:** an Architecture Verdict with findings `AR-n` graded `CRITICAL | WARNING | SUGGESTION` (only CRITICAL blocks), plus **Checked and clean**, **Pre-existing, not introduced here**, **Not verified** and **Scope & limits**. Target length is about 1,500 tokens; `path:line` citations and the Not verified list are never trimmed.

## Requirements / limits

- **Read-only, enforced by tools.** Tools: `Read, Grep, Glob, TodoWrite, Skill`. Denied: `Write, Edit, NotebookEdit, Bash, WebSearch, WebFetch`. It cannot change files, run commands, or browse the web.
- **No shell, no git.** It cannot run `git diff`, typecheck, tests or builds. Paste the diff when history matters.
- **Model:** `sonnet`, `effort: high`, `maxTurns: 35`. When the budget runs low it stops and reports what it did not reach.
- **Not a PR gate.** If the project has a PR gate, that gate owns the final diff; this agent gives a verdict before that, on plans and work in progress.
- **Not a security review**, and not a performance or style review. Possible security issues are only flagged under **Not verified**.
- Flags only what the change introduced or worsened; an empty findings list with `approve` is a valid result.
- Does not launch other agents.

## Related plugins

- **Depends on:** [`engineering-paved-path`](../engineering-paved-path/) — the `engineering-paved-path:architecture` skill (stack-neutral layering and frontend structure rules) that this agent preloads.
- **Used by:** [`sdd-engineering`](../sdd-engineering/) — its `run-plan` skill launches `architecture-review:architecture-reviewer` in parallel with `sdd-engineering:plan-verifier` after the implementer lanes finish, then merges both reports into one bounded fix cycle.

## Credits

Author: DevDigest AI Engineering. Generalized from an in-house architecture reviewer agent; no third-party sources.

See [CHANGELOG.md](CHANGELOG.md) for release history.
