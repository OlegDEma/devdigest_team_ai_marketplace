# Security Review

A read-only Claude Code agent that gives a security verdict on a plan, a working tree or a named file list: authentication and authorization, input validation at the edge, injection (SQL, command, path, prompt), secrets, SSRF and other external I/O, unsafe rendering (XSS), deserialization, dependency and supply-chain red flags, logging of sensitive data, and CORS and headers. It returns `approve`, `request_changes` or `comment` with quoted `path:line` evidence, and it works **before** a PR exists. Every CRITICAL finding is adversarially verified by the agent itself (it tries to refute the finding by reading callers and guards) before it is reported. Install it if you want a security second opinion without giving that reviewer any way to change your code.

## Install

```bash
claude plugin install security-review@dev-digest-ai-marketplace
```

This also installs its dependency **`engineering-paved-path`** (`^1.0.0`), which provides the `engineering-paved-path:security` skill the agent preloads. Without it the agent would review with no security rules.

## What's inside

| Component | Invocation | Purpose |
| :- | :- | :- |
| Agent `security-reviewer` | `@agent-security-review:security-reviewer` in chat, or `subagent_type: "security-review:security-reviewer"` from a skill or the main session | Read-only security verdict with `path:line` evidence on a plan, a working tree or a file list |

## When to use it

- A plan adds or changes an endpoint, a file upload, an outbound call, a login flow or anything that handles secrets, and you want it judged before the owner approves it.
- A feature is half-built and you want to know about an auth gap or an injection path before there is a PR.
- You changed a handful of sensitive files and want a focused re-check of them (lite mode), or a re-check of findings from an earlier verdict.

## How to use

### 1. Review a plan

```text
@agent-security-review:security-reviewer Review docs/plans/2026-10-20-export-reports.md
for security. Security conventions are in AGENTS.md under "Security".
```

### 2. Review a working tree

```text
@agent-security-review:security-reviewer Review src/modules/billing/ (work in progress, no PR).
Intent: add invoice retries. Here is the diff so far: <paste `git diff` output>
```

The agent has no shell, so it cannot run `git diff` or a dependency audit. Paste the diff (or the audit output) when "what this change introduced" or advisory data matters; otherwise it reviews the files as they are and lists the gap under **Not verified**.

### 3. Lite mode and re-check

```text
@agent-security-review:security-reviewer Lite review of src/api/auth/routes.ts and
src/api/upload/routes.ts only. Re-check SR-1 and SR-3 from the earlier verdict.
```

It reviews only the named files, reports each earlier `SR-n` as `fixed`, `still present` or `changed`, and lists everything else as "not reviewed (lite mode)".

### From a skill or the main session

```text
Agent(subagent_type: "security-review:security-reviewer",
      prompt: "Review plan docs/plans/2026-10-20-export-reports.md for security. ...")
```

Always pass the full namespaced `subagent_type`.

### Example verdict (abridged)

```markdown
# Security verdict: src/api/reports/

**Verdict:** request_changes
One CRITICAL: the report route reads a report by id without checking the caller owns it.

## Findings
### SR-1 — CRITICAL — GET /reports/:id returns any user's report
- Rule: Authn/Authz
- Evidence: `src/api/reports/routes.ts:31`
  ```
  const report = await reportsRepo.findById(req.params.id);
  ```
- Trigger: any logged-in user requests another user's report id and receives its contents.
- Verified: the router-level auth barrier only checks login (`src/api/index.ts:12`); `findById` has no owner filter (`src/data/reports.repo.ts:18`); no caller adds one.
- Fix direction: scope the lookup by the caller's user id.

### SR-2 — WARNING — the report title is rendered as raw HTML
- Rule: Unsafe rendering
- Evidence: `src/ui/ReportCard.tsx:22`

## Checked and clean
- Injection: all queries go through parameterized repository methods.

## Not verified
- Dependency advisories: no shell or network; paste your audit output to include them.

## Scope & limits
Full mode. Conventions inferred from the repository (assumption). Entry points: 3 routes in `src/api/reports/`. Files read: 9.
```

## Inputs and conventions

**Target** (one of): a plan file (default `docs/plans/YYYY-MM-DD-slug.md`), a working tree or folder, a named file list, or pasted diff text.

**Your security conventions.** The agent looks for them in this order and says which source it used: your prompt or the plan; the project's conventions file (`CLAUDE.md`, `AGENTS.md`, or a security doc they point to); inferred from the repository (auth middleware, schema validators, framework security plugins). Findings that rest only on inferred conventions are capped at WARNING. Add a short "Security" section to `AGENTS.md` (how auth works, where input is validated, accepted risks) for sharper verdicts.

**Optional:** the change's intent in one sentence, known accepted risks, and earlier `SR-n` ids to re-check.

**Output:** a Security Verdict with findings `SR-n` graded `CRITICAL | WARNING | SUGGESTION` (only CRITICAL blocks), plus **Re-check**, **Checked and clean**, **Pre-existing, not introduced here**, **Not verified** and **Scope & limits**. Target length is about 1,500 tokens; `path:line` citations and the Not verified list are never trimmed.

## Requirements / limits

- **Read-only, enforced by tools.** Tools: `Read, Grep, Glob, TodoWrite, Skill`. Denied: `Write, Edit, NotebookEdit, Bash, WebSearch, WebFetch`.
- **No shell, no network.** It cannot run `git diff`, a scanner, a dependency audit or the app, and cannot look up advisories or CVEs. Paste what it needs; the gap is listed under **Not verified**.
- **Self-verification, not a second agent.** Agents cannot launch agents, so the adversarial check of each CRITICAL is a separate pass by the same agent. A CRITICAL it could not verify within budget is reported as an `unverified` WARNING.
- **Model:** `sonnet`, `effort: high`, `maxTurns: 35`. When the budget runs low it stops and reports what it did not reach.
- **Not a PR gate.** If the project has a PR gate, that gate owns the final diff; this agent gives a verdict before that.
- **Not an architecture review** and not a penetration test. Structural problems are only flagged under **Not verified**.
- Never prints a full secret; flags only what the change introduced or worsened; an empty findings list with `approve` is a valid result.
- Does not launch other agents.

## Related plugins

- [`engineering-paved-path`](../engineering-paved-path/) provides the `security` skill this agent preloads (required).
- [`architecture-review`](../architecture-review/) is the sibling reviewer for layering and boundaries; this agent does not judge architecture.
- [`sdd-engineering`](../sdd-engineering/): the `run-plan` skill is planned to launch `security-review:security-reviewer` alongside the architecture reviewer and the plan verifier after implementation. That wiring ships in a separate release; until then, launch the agent by hand.
