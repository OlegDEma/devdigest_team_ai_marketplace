# Routing, severity, mode

The tables the review runs on.

## Config: `.claude/pr-gate.json` (optional, in the project)

```json
{
  "mode": "report-only",
  "base": null,
  "caps": {
    "max_review_agents": 4,
    "max_findings_per_slice": 40,
    "max_suggestions_shown": 10
  }
}
```

- `mode`: `report-only` (default; nothing is blocked, the report says what would have been) or `blocking` (a confirmed CRITICAL refuses the PR). The mode is copied into each stamp, so changing it never re-judges an existing review.
- `base`: a ref to use as the base branch, or `null` to auto-detect (`origin/HEAD`, then `origin/main`, `origin/master`, `main`, `master`, `develop`).
- `caps`: bounds on fan-out and noise.

**Where state lives, and why.** Stamps and reports go in the project's `.claude/reviews/`, not in `${CLAUDE_PLUGIN_DATA}`: a stamp belongs to one repository and branch, the team may want to commit it or read it from CI, and `${CLAUDE_PLUGIN_DATA}` is per user and invisible to the repository. The plugin folder itself is never written to.

## Slices

Cut the changed files into slices by what they are, not by hardcoded folder names. Read `AGENTS.md`/`CLAUDE.md` and the repo layout first and use the project's own names.

| Slice | Claims | Skills and agents the reviewer uses (only if installed) |
| --- | --- | --- |
| **frontend** | UI code: `*.tsx`/`*.jsx`/`*.vue`/`*.svelte`, component and page folders; not tests | `engineering-paved-path:react-best-practices`, `engineering-paved-path:next-best-practices` (Next.js projects), `engineering-paved-path:typescript-expert` |
| **tests** | `*.test.*`, `*.spec.*`, `__tests__/` | `engineering-paved-path:react-testing-library` (React), the project's test conventions |
| **backend** | server, API, service and data-access code; not migrations | `engineering-paved-path:fastify-best-practices` (Fastify), `engineering-paved-path:architecture`, `architecture-review:architecture-reviewer`, `engineering-paved-path:typescript-expert` |
| **schema** | ORM/schema definitions, SQL, migrations | the project's data conventions; tripwire T1 |
| **contracts** | shared schemas/types used by more than one package (OpenAPI, Zod, protobuf, shared types) | `engineering-paved-path:zod`, `engineering-paved-path:typescript-expert`; tripwire T5 |
| **security-sensitive** | auth, sessions, crypto, file upload, SQL built from input, new routes | `engineering-paved-path:security`, `security-review:security-reviewer` |
| **other** | scripts, CI, config, infrastructure | the project's own conventions |

Fold small slices into a neighbour so the run stays at 2 to 4 agents: frontend plus tests become one Frontend reviewer; backend plus schema plus contracts become one Backend reviewer; security-sensitive files are reviewed by the Backend reviewer unless `security-review:security-reviewer` is installed, in which case it gets its own pass. Every slice also runs the tripwires.

If none of the optional plugins are installed, the reviewer applies the project's own conventions and the tripwires only, and the report says so under "What I could not check".

**Excluded from every slice** (the collector strips them): `node_modules`, lockfiles, build output (`dist`, `build`, `.next`, `coverage`), minified files and `.claude/reviews/`. Documentation-only changes do not need a code gate.

## What is not routed, on purpose

- A skill or agent that is not installed. The gate never fails because a reviewer is missing; it reports the gap.
- Bug-finding at large: `/code-review` and `/security-review` exist for that. This gate routes, unifies severity and decides; it does not reimplement them, and it cannot launch user-run commands itself.

## Severity scale: the gate owns it

Skills define severity differently or not at all, and mapping between vocabularies is guesswork, so reviewers classify against this one table.

| Level | Blocks in `blocking` mode? | Meaning |
| --- | --- | --- |
| **CRITICAL** | yes | Ships a defect: a correctness bug, a security hole, a broken build or check, or an architecture-boundary break. |
| **WARNING** | no | Works but degrades: performance, maintainability, a missing test for changed logic, logic in the wrong layer that still compiles. |
| **SUGGESTION** | no | Taste: naming, minor placement, optional simplification. |

**The load-bearing rule:** a CRITICAL must state a concrete production consequence — the input or state and the resulting wrong output, crash or exposure. "Violates the layering convention" alone is not a CRITICAL; drop it one level. Deterministic Tier-1 failures are the exception: a red check is a fact.

Mapping sources: honor a skill's own CRITICAL tag, then translate (a skill's HIGH or perf level maps to WARNING; a boundary violation with a consequence maps to CRITICAL). A tripwire hit takes its stated level. For a skill with no taxonomy, ask the consequence question.

**Confidence** decides whether a CRITICAL may block: only one that survives verification blocks; an unconfirmed one is reported as "flagged, not confirmed — verify manually". A rule violated on a line the PR did not touch is at most a SUGGESTION: the gate judges this change, not the repository's history.
