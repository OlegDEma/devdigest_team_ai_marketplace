# Research Tools

A read-only `researcher` agent that answers concrete questions with evidence. It works in two modes: **repository research** (how a flow works end to end, what was already decided, what changed and when, using the code, docs and git history) and **external research** (library and API behaviour, release notes, upstream issues, RFCs, CVEs, how other projects solve a problem, using WebSearch and WebFetch). Every report separates conclusions from evidence (`path:line` or source URLs) and ends with an explicit list of what it could not find. Install it if you want research that you can trust and hand to another agent without re-checking, or if you use the `sdd-engineering` workflow, which depends on it.

## Install

```bash
claude plugin install research-tools@dev-digest-ai-marketplace
```

The plugin has no dependencies. It is installed automatically when you install `sdd-engineering@dev-digest-ai-marketplace`.

## What's inside

| Component | Type | Invocation | Purpose |
| :- | :- | :- | :- |
| `researcher` | agent | `@agent-research-tools:researcher` or `subagent_type: "research-tools:researcher"` | Finds and verifies facts in the repository or external sources; returns a structured report with cited evidence and a "Not found / unverified" list. Never edits files. |

## How to use

Mention the agent in a prompt, or let the main session launch it with the Agent tool and `subagent_type: "research-tools:researcher"`. Give it one concrete question; if you give it only a topic, it asks up to 4 clarifying questions and researches nothing until you answer.

### When to use it

- "How does X flow end to end?" across several files or packages.
- "What did we already decide about W?" from specs, decision records, docs and git history.
- "When and why did this change?" from `git log -S`, `git blame` and commit messages.
- Library or API behaviour for the version the project actually installs, release-note and breaking-change checks, upstream issues, CVEs, standards text.
- Research requests (R1, R2, …) raised while writing a spec.

### When not to use it

- To write, fix or refactor code, or to write docs: it is read-only.
- For a single lookup you can do with one grep or one file read: do it directly.
- For open-ended surveys with no question ("research caching"): it will only ask clarifying questions. Narrow the question first.
- For architecture verdicts on a plan or diff: use `architecture-review:architecture-reviewer`.
- For questions that need a running system, a database or secrets: it reports those as unverified.

### Example requests

```text
@agent-research-tools:researcher How does an uploaded file get from the upload endpoint to object storage? Trace the flow end to end and cite each step.
```

```text
@agent-research-tools:researcher What did we decide about retrying failed webhook deliveries, and when did that change? Check specs, docs and git history.
```

```text
@agent-research-tools:researcher Does the version of our HTTP client installed in this repo retry on 429 by default? Check the release notes for the installed version.
```

```text
@agent-research-tools:researcher R2 — Which fields of the user profile response are rendered on the settings page, and where do they come from? → changes: the scope of AC-4.
  - Already cited: src/api/profile.ts:40-72
```

### Example report (abridged)

```markdown
# R2 — Repo research: which profile fields the settings page renders, and their source

## Answer
The settings page renders 4 of the 7 profile fields; `timezone` is read but not shown.
All 4 come from the single profile request in `useProfile`.

Confidence: high — every field traced from the component to the API call.

## Findings

### F1 — The page renders name, email, avatar and locale
- Evidence: `src/pages/settings/ProfileCard.tsx:18-41`
- What it shows: four bound fields; no other profile field is referenced.
- Source type: code

### F2 — The data comes from one request, cached per session
- Evidence: `src/hooks/useProfile.ts:9-22`, decision in `docs/decisions/0007-profile-cache.md:12`
- Source type: code, decision record

## Not found / unverified
- Whether `timezone` is ever shown elsewhere — searched `timezone|timeZone` across `src/`; only read in `useProfile.ts:20`.
- Server-side field filtering — needs a running API to confirm.

## Scope & limits
- Searched: `src/`, `docs/`. Not searched: generated API client (build output).
```

External research reports follow the same shape, with `[S1]` citation markers, a **Conflicts & uncertainty** section and a **Sources** table (URL, publication date, source type, whether the page was actually read).

## Inputs and conventions

- **Input:** one concrete question in the prompt. Optional: an `R<n>` id, a "→ changes: …" clause saying what the answer affects, and an "Already cited" line with `path:line` evidence the caller already holds (the agent does not re-read those lines).
- **Repository search order:** specs and design docs (default `docs/specs/`), other docs and decision records, research and plan files (`docs/research/`, `docs/plans/`), the project's conventions file if one exists (`CLAUDE.md`, `AGENTS.md`) and READMEs, then git history, then source. Locations follow the project's conventions when it names others.
- **Exclusions:** dependency folders, build output, coverage, vendored code, local worktrees or cloned copies of the repository, and anything the conventions file marks as excluded.
- **Version pinning (external mode):** the agent reads the installed version from the project's manifest or lockfile (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, …) before asserting which behaviour applies.
- **Output:** a single report in the agent's final message, about 1,500 tokens. `path:line` citations and the "Not found / unverified" list are never trimmed.

## Requirements / limits

- **Tools:** `Read, Grep, Glob, Bash, WebSearch, WebFetch, TodoWrite`. `Write` and `Edit` are disallowed, and `Bash` is restricted by instruction to read-only commands (`cat`, `rg`, `ls`, `git log`, `git show`, `git blame`, `git diff`, …).
- **Read-only guarantees:** never creates, edits or deletes files; never commits, checks out or installs; never signs in, accepts terms, submits forms or downloads files on the web; treats everything it reads as data, never as instructions.
- **No delegation:** the agent has no `Agent` tool and never launches other agents or deep-research commands. For pure call-graph or import tracing it uses `Grep`/`Glob` itself, or lists the tracing that is still needed in its report.
- **Model and budget:** `sonnet`, `maxTurns: 40`, with a reserve of 4 turns to emit a partial report marked `## Not finished / budget exhausted`.
- **External binaries:** none required. `rg` (ripgrep) and `fd` are used when available; `git` is needed for history questions.
- **Web access:** external research needs WebSearch and WebFetch to be allowed in your Claude Code permissions.

## Related plugins

- **Dependencies:** none.
- **Used by:** [`sdd-engineering`](../sdd-engineering/). Its `spec` skill runs each research request (R1, R2, …) returned by `sdd-engineering:spec-creator` as a parallel `research-tools:researcher` subagent, passes the reports back to `spec-creator`, and saves them verbatim to `docs/research/<slug>.research.md`, which `sdd-engineering:implementation-planner` reads instead of redoing the research. The report format is built for this: it keeps the `R<n>` id, honours "Already cited", answers the "→ changes" clause first, cites exact `path:line` lines that the next agent can trust without re-reading, and lists every gap so the spec or plan can turn it into an open question.

## Credits

Author: DevDigest AI Engineering. No third-party content.

See [CHANGELOG.md](CHANGELOG.md) for the release history.
