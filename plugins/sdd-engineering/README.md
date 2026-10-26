# SDD Engineering

Spec-driven development (SDD) for Claude Code: turn an idea or a design into an
approved specification, the specification into an implementation plan, and the
plan into reviewed, verified code — with a dedicated agent for every step and
the owner approving each hand-off. Install it if you want a repeatable
spec → plan → implement → review → verify → retro loop in any repository,
instead of asking one long chat to "just build it". It is stack-neutral; the
paved-path skills it points implementers at cover React, Next.js, Fastify,
TypeScript and Zod, and steps outside those stacks fall back to your project's
own conventions.

## What SDD means here

| Step | What happens | Who does it | Output |
| :- | :- | :- | :- |
| 1. Spec | The WHAT and WHY, with EARS acceptance criteria (`AC-n`), edge cases, contracts and diagrams, after rounds of gap-finding questions | `sdd-engineering:spec-creator`, driven by `/sdd-engineering:spec` | `docs/specs/YYYY-MM-DD-slug.md` |
| 2. Plan | The HOW: requirements review, then a phased, file-by-file plan where every step maps to an AC and to an `engineering-paved-path` skill | `sdd-engineering:implementation-planner` | `docs/plans/YYYY-MM-DD-slug.md` |
| 3. Implement | Code and tests per AC, phase by phase, self-verified with the plan's commands | `sdd-engineering:implementer` × N, driven by `/sdd-engineering:run-plan` | code changes + Implementation Report |
| 3b. Plan check (optional, before 3) | Read-only plan-time architecture verdict, plus a security verdict when the plan names untrusted input, auth, external I/O or secrets | `/sdd-engineering:review-plan` → `architecture-review:architecture-reviewer` (+ `security-review:security-reviewer`) | short verdict + findings; the plan is never edited |
| 4. Review | Read-only architecture and security verdicts on the diff | `architecture-review:architecture-reviewer` ‖ `security-review:security-reviewer` | Architecture Verdict, Security Verdict |
| 5. Verify | Every AC checked as Met / Not met / Unverifiable with evidence; the plan's commands re-run | `sdd-engineering:plan-verifier` | Plan Verification Report |
| 6. Fix | Bounded fix cycle (default 3 rounds) on CRITICAL findings, architecture and security WARNINGs, and unmet ACs | the same implementers, reviewer and verifier | updated code + reports |
| 7. Retro | Facts (tokens, agents, timeline, errors) plus a judged analysis of the run | `/sdd-engineering:workflow-retro` | `docs/retros/YYYY-MM-DD-slug.md` |

Agents never launch other agents (none has the `Agent` tool). The **main
session** launches every agent, following the `spec` and `run-plan` skills, and
every step after the spec starts only on an explicit owner request.

```mermaid
graph LR
  idea[Idea / request / design] -->|/sdd-engineering:spec| spec[spec-creator<br/>docs/specs/*.md]
  spec -.->|research requests| res[research-tools:researcher × N]
  res -.->|reports| spec
  spec -->|owner approves, asks to plan| plan[implementation-planner<br/>docs/plans/*.md]
  plan -->|optional| rp[/sdd-engineering:review-plan/<br/>read-only plan check]
  rp -->|defect: back to planner via owner| plan
  rp -->|owner approves| run[/sdd-engineering:run-plan/]
  plan -->|owner approves| run
  run --> impl[implementer × N]
  impl --> rev[architecture-review:architecture-reviewer]
  impl --> sec[security-review:security-reviewer]
  impl --> ver[plan-verifier]
  rev --> fix[bounded fix cycle]
  sec --> fix
  ver --> fix
  fix --> done[Done: report to owner]
  done -->|/sdd-engineering:workflow-retro| retro[Retrospective: tokens, agents, time]
```

## Install

```bash
claude plugin install sdd-engineering@dev-digest-ai-marketplace
```

This also installs its four dependencies, each at `^1.0.0`:

| Dependency | Provides | Used for |
| :- | :- | :- |
| `engineering-paved-path` | skills `react-best-practices`, `next-best-practices`, `fastify-best-practices`, `architecture`, `react-testing-library`, `security`, `typescript-expert`, `zod`, `mermaid-diagram` | every plan step names one; `implementation-planner` preloads `architecture`; `spec-creator` uses `mermaid-diagram` and `security` |
| `research-tools` | agent `researcher` | research requests during the spec rounds |
| `architecture-review` | agent `architecture-reviewer` | the plan check in `review-plan` and the architecture review in `run-plan` |
| `security-review` | agent `security-reviewer` | the security review in `run-plan` (every source-code diff) and, when the plan names untrusted input, auth, external I/O or secrets, in `review-plan` |

Check the install with `claude plugin details sdd-engineering@dev-digest-ai-marketplace`:
it should list four agents and four skills.

## What's inside

| Component | Invocation | Purpose |
| :- | :- | :- |
| skill `spec` | `/sdd-engineering:spec <requirements>` | Entry point for writing, revising or approving a spec: runs `spec-creator` rounds, fans out researchers, relays questions, sets `approved` only on your word |
| skill `review-plan` | `/sdd-engineering:review-plan plan:<path>` | Read-only plan check before implementation: plan-time architecture review (plus security review when the plan names untrusted input, auth, external I/O or secrets), a ≤ 15-line verdict. Never edits the plan |
| skill `run-plan` | `/sdd-engineering:run-plan plan:<path>` | Runs an approved plan: implementers by the plan's DAG → architecture reviewer ‖ security reviewer ‖ verifier → bounded fix cycle → short report |
| skill `workflow-retro` | `/sdd-engineering:workflow-retro` (manual only) | Retrospective of a multi-agent run from the session transcripts, with recommendations |
| agent `spec-creator` | `subagent_type: "sdd-engineering:spec-creator"` (launched by the `spec` skill) | Writes the spec: EARS ACs, edge cases, contracts, diagrams; never plans or codes. `opus` |
| agent `implementation-planner` | `@agent-sdd-engineering:implementation-planner` or `subagent_type: "sdd-engineering:implementation-planner"` | Two passes: requirements review + execution-mode question, then the plan file. Never edits the spec. `opus` |
| agent `implementer` | `subagent_type: "sdd-engineering:implementer"` (launched by `run-plan`) | Executes plan phases, writes tests per AC, runs the plan's checks, reports. `sonnet` |
| agent `plan-verifier` | `subagent_type: "sdd-engineering:plan-verifier"` (launched by `run-plan`) | Read-only: every AC Met / Not met / Unverifiable with evidence; re-runs the plan's commands. `sonnet` |

Agents from the dependencies are launched as `research-tools:researcher`,
`architecture-review:architecture-reviewer` and `security-review:security-reviewer`. The skills always pass the full
namespaced `subagent_type`, because other plugins can ship agents with the same
short name.

## How to use

### 1. Write the spec

```text
/sdd-engineering:spec Users need to export the monthly report as CSV from the
Reports page. Design: ./designs/export-button.png. Reference spec: none.
```

Round 1 comes back as an analysis: design gaps, proposals, up to six
**blocking questions** (each with context, options with cost and a
recommendation) and research requests. The main session asks you the questions,
runs `research-tools:researcher` for each request in parallel, and resumes the
same `spec-creator`. Round 2 writes `docs/specs/2026-10-26-export-report-csv.md`
(`Status: draft`) and saves the research to
`docs/research/2026-10-26-export-report-csv.research.md`. You get the path, the
counts (stories, ACs, contracts, edge cases, NFRs), the self-check result and
the open questions with their defaults. Answer or edit until you are happy,
then say:

```text
Approve the spec — set status approved.
```

### 2. Plan it

```text
Plan docs/specs/2026-10-26-export-report-csv.md with
sdd-engineering:implementation-planner.
```

Pass 1 writes nothing and returns a **requirements review**: each requirement
restated as `R1…Rn`, 1–4 questions with defaults, contradictions, recommendations
and the question **single agent or multi-agent?** Reply with:

```text
## Owner answers
Q1: defaults OK
Accepted: R1 · Rejected: R2
Execution mode: multi
```

The main session continues the same planner (`SendMessage`), which writes
`docs/plans/2026-10-26-export-report-csv.md` and a ≤ 40-line summary. Read the
plan file and approve it (or ask for "revise the plan").

### 2b. Check the plan (optional, recommended)

```text
/sdd-engineering:review-plan plan:docs/plans/2026-10-26-export-report-csv.md
```

The chain is **plan → review-plan → owner approves → run-plan**. The skill runs
`architecture-review:architecture-reviewer` in plan-time mode on the plan (and
`security-review:security-reviewer` too when the spec or plan names untrusted
input, auth, external I/O or secrets), then gives you a verdict of at most 15
lines and the findings. It is read-only and **never edits the plan or the spec**:
a defect goes back to `implementation-planner` through you, and you run
`review-plan` again. `run-plan` reminds you of this step when the plan header
shows no review.

### 3. Implement, review, verify

Start a fresh chat (the plan file is the whole hand-off):

```text
/sdd-engineering:run-plan plan:docs/plans/2026-10-26-export-report-csv.md max-fix:2
```

The review step launches the architecture reviewer, the security reviewer and
the verifier in one parallel message. The security reviewer is skipped only for
docs- or config-only diffs, or when you put `security:skip` in the `run-plan`
free text. You get a ≤ 15-line report: lanes run, the verifier's and both
reviewers' verdicts, fix rounds used and why the loop stopped, open items
(unfixed CRITICAL, Not met or Unverifiable ACs), and WARNINGs and SUGGESTIONs
for you to decide. If the `pr-gate` plugin is installed, the report suggests its
`pr-self-review` skill as the next check. Nothing is committed or pushed.

### 4. Retro (optional)

```text
/sdd-engineering:workflow-retro --since 2026-10-26T09:00:00Z
```

Writes `docs/retros/2026-10-26-export-report-csv.md` with the collected facts
(tokens per agent, timeline, parallelism, duplicated reads, tool errors) and
up to ~7 recommendations, appends a row to `docs/retros/INDEX.md`, and gives
you a 3–5-line summary.

## Where you approve

| Gate | What you do | What happens without it |
| :- | :- | :- |
| Spec blocking questions | Answer them (or accept the recommendations) | No spec file is written |
| Spec approval | Say "set status approved" | The planner only reviews a `draft` spec; it does not plan it |
| Plan pass 1 | Reply with `## Owner answers` including `Execution mode:` | The planner stays in pass 1 |
| Plan check | Run `/sdd-engineering:review-plan` and read the verdict (optional) | Defects in the plan reach the code and cost more to fix |
| Plan approval | Approve the plan file (or say go when `run-plan` asks) | `run-plan` asks before flipping a `draft` plan to `approved` |
| Live paid calls | Put "owner approves live-smoke spend" in the `run-plan` free text | Implementers skip paid live checks and report them as not run |
| After `run-plan` | Review the diff, decide on leftover WARNINGs, run your PR gate | Nothing is committed, pushed or opened as a PR |

## Single- vs multi-agent execution

The planner always asks; you decide, and `run-plan` can override with
`mode:single|multi`.

- **Single agent** — one `implementer` runs every phase in order in one
  context. Best for small or tightly coupled changes; the plan optimises for
  clarity, not parallelism.
- **Multi-agent** — `run-plan` launches one `implementer` per lane in plan §8.
  The contracts/schema lane runs first and alone; parallel lanes own disjoint
  file sets (or run with `isolation: worktree` and a named merger); a lane
  starts only after the lanes it waits on pass their checkpoint. Best for
  non-trivial work spanning several modules.

Either way, architecture review, security review and verification run after all lanes, in parallel, and fixes
go back to the **same** agents through `SendMessage` (they keep their context;
re-reviews look only at changed files and open findings).

## Inputs and conventions

The plugin assumes nothing about your layout. Defaults, and how to change them:

| Input | Default | How to change |
| :- | :- | :- |
| Spec location | `docs/specs/YYYY-MM-DD-slug.md` | Say so in the request, or state it in your conventions file |
| Plan location | `docs/plans/YYYY-MM-DD-slug.md` (same name as the spec) | Same |
| Research file | `docs/research/<slug>.research.md` | Same |
| Retro location | `docs/retros/YYYY-MM-DD-slug.md` + `docs/retros/INDEX.md` | Same |
| Conventions file | `CLAUDE.md` or `AGENTS.md` (root and per module), if present | Agents read it for reading order, layer map, commands, do-not-touch paths and secrets location. Nothing fails when it is missing |
| Build / typecheck / test commands | The commands the plan's §11 names, with their source | The planner takes them from your conventions file, `package.json` scripts, `Makefile`/`justfile`, `pyproject.toml`, `Cargo.toml`, `go.mod` or CI config; implementers and the verifier fall back to the same discovery and say so |
| Package manager | The one your lockfile indicates, per module | — |
| Layer map | From the spec, the conventions file, or inferred from the repo and confirmed with you in plan pass 1 | Describe your layers in the conventions file |
| Figma | Optional | If a Figma MCP server is connected to your session, the `spec` skill reads the frames and passes images/text to `spec-creator`; otherwise give screenshots or a description |

**Adapting to your project.** Put the things the agents should know in your
conventions file: where specs and plans live (if not `docs/`), the per-module
typecheck/test/full-suite commands (and any that fail in your environment, with
the working alternative), the layer map, generated artifacts and their
generator commands (migrations, codegen), where secrets live, and folders to
never search or touch (vendored copies, worktrees). The planner turns these into
§10 tripwires and §11 commands; implementers and the verifier follow them.

## Requirements and limits

- **Claude Code** with plugin dependency support. Models: `spec-creator` and
  `implementation-planner` run on `opus` (judgement-heavy, manual steps);
  `implementer` and `plan-verifier` run on `sonnet`. `security-reviewer` (from
  `security-review`) and `architecture-reviewer` run on `sonnet`.
- **`python3` 3.9+** on `PATH` for `/sdd-engineering:workflow-retro` (stdlib
  only). The skill pre-approves only its own `collect.py` command.
- **Tools and write scope.** `spec-creator` writes only spec files and has no
  shell. `implementation-planner` writes only the plan file; its shell is
  read-only by instruction. `implementer` writes code and runs commands; no web.
  `plan-verifier` cannot write or edit (harness-enforced) and runs only reads
  and the plan's commands. The two reviewers have no `Write`, `Edit` or `Bash`. Instruction-level limits on agents that hold `Bash`
  are not a sandbox; use `permissions.deny` in your settings for hard
  guarantees.
- **Cost.** A full run launches several agents; a resumed agent re-sends its
  whole context every turn. The skills keep reports short and reuse agents by
  `SendMessage`, but measure with `workflow-retro`.
- **Not included:** committing, pushing, opening PRs, a PR gate, a separate
  test-writing agent (implementers write tests per AC), database-specific
  skills (plans name `none` for data steps).
- `workflow-retro` reads Claude Code's internal transcript format, which can
  change between versions; missing fields show as zero or "unknown".
- Agents run with a turn budget (`maxTurns`: spec-creator 60, planner 50,
  implementer 150, verifier 50) and report `Not finished / budget exhausted`
  when they run out; the skills continue them once.

## Troubleshooting

| Symptom | Cause | Fix |
| :- | :- | :- |
| `Agent type 'research-tools:researcher' not found` (or `architecture-review:architecture-reviewer`, `security-review:security-reviewer`) | A dependency plugin is missing or disabled | Reinstall `sdd-engineering` from the marketplace (it pulls dependencies), or install/enable the named plugin; check with `claude plugin list` |
| `Agent type 'implementer' not found` or the wrong agent runs | Launched by short name | Always use the namespaced type, e.g. `sdd-engineering:implementer`; the skills already do |
| Planner starts without the architecture rules, or `Unknown skill: engineering-paved-path:...` | `engineering-paved-path` is missing or disabled | Install or enable `engineering-paved-path` from the same marketplace |
| `/sdd-engineering:spec` is not recognised | Plugin not enabled in this session, or the short `/spec` form was used | Enable the plugin and use the namespaced command |
| `/sdd-engineering:workflow-retro` prints `no transcripts in …` | Claude Code was started in another directory than the current one | Pass `--cwd <dir the session started in>` or `--project-dir ~/.claude/projects/<folder>` |
| The planner replies "Spec required" | No spec path, or the file does not exist | Write the spec with `/sdd-engineering:spec` first |
| `run-plan` refuses | Plan missing, or its spec is not `Status: approved` | Approve the spec; say go to flip a `draft` plan |
| Verifier reports commands as `not_run` | No Docker, database or secret in this environment | Provide the service, or accept the ACs as Unverifiable |

## Evals

`evals/` holds a cheap namespace smoke suite in the
[`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals.md) format:
six cases, one run each, no judge graders.

| Case | Checks |
| :- | :- |
| `skill-spec-resolves`, `skill-review-plan-resolves`, `skill-run-plan-resolves`, `skill-workflow-retro-resolves` | Typing `/sdd-engineering:<skill>` loads the skill (the reply echoes its first heading; no "unknown command") |
| `agents-resolve` | `sdd-engineering:spec-creator`, `sdd-engineering:implementation-planner`, `sdd-engineering:implementer`, `sdd-engineering:plan-verifier`, `research-tools:researcher`, `architecture-review:architecture-reviewer`, `security-review:security-reviewer` launch without `Agent type '…' not found` |
| `paved-path-architecture-resolves` | `engineering-paved-path:architecture` loads with the Skill tool |

Run from the marketplace root (each run is a real model call on your account):

```bash
claude plugin eval plugins/sdd-engineering --ablation none --threshold 1.0 --no-publish
```

Notes and limits:
- Each case lists the four dependency folders in `plugins:` (relative paths to
  sibling plugins in this marketplace), because an eval run loads only the
  plugins it is given. To test the installed copy instead, run
  `claude plugin eval sdd-engineering@dev-digest-ai-marketplace --ablation none`.
- Use `--ablation none`: a no-plugin baseline is meaningless for a namespace
  check (every case fails without the plugin by design).
- The format cannot assert directly that a name is registered; the cases infer
  it from a successful load or launch plus the absence of the "not found" /
  "unknown" error in the transcript. The slash-command cases assume the eval
  harness expands a user-typed `/plugin:skill` in the prompt; if it does not,
  the model-invocable `spec`, `review-plan` and `run-plan` cases may still pass via the Skill
  tool, while `workflow-retro` (manual only) will fail and should be checked
  by hand.
- `agents-resolve` briefly runs seven subagents (two on `opus`) with a one-line
  task; it is the most expensive case.
- `results/` is git-ignored.

## Related plugins

- Depends on: `engineering-paved-path`, `research-tools`, `architecture-review`,
  `security-review` (all `^1.0.0`).
- Works with, no dependency: `pr-gate` (`pr-self-review`), suggested in the
  `run-plan` report when installed.
- Used by: none yet. Other plugins can reuse the agents by their namespaced
  names.

## Credits

Author: DevDigest AI Engineering. The agents and skills were generalized from an
internal spec-driven workflow; no third-party content is bundled. EARS
(Easy Approach to Requirements Syntax) is the requirements pattern by Alistair
Mavin et al.

See [CHANGELOG.md](CHANGELOG.md) for changes and [RELEASES.md](RELEASES.md) for
release evidence.
