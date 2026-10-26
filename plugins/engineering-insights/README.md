# engineering-insights

A compounding project memory for Claude Code. After a non-trivial task, the
`engineering-insights` skill writes what was learned - things true about the code
but not visible in it - into the `INSIGHTS.md` of the module you touched. Before
work, the same skill recalls those entries. A read-only `insight-curator` agent
audits all `INSIGHTS.md` files when a ledger says it is time.

## What is inside

| Item | Type | Purpose |
|------|------|---------|
| `engineering-insights:engineering-insights` | skill | Record and recall insights: routes the touched path to the right `INSIGHTS.md`, dedups, enforces fixed sections, dated append-only entries with Evidence, and a quality bar (5-minute and cold-read tests). Skips when nothing non-obvious came up. |
| `engineering-insights:insight-curator` | agent | Read-only audit of every `INSIGHTS.md`: duplicates, contradictions, stale evidence, misfiled entries, files near the ~200-entry split point, promotion candidates. Returns a proposal table; edits nothing. |
| `scripts/ledger.sh` | script | Counts completed wrap-ups and reports "curation due" at 10. |

The skill needs no hardcoded package list: it discovers modules (directories that
hold an `INSIGHTS.md`, or package roots with their own manifest) and treats the
repository-root `INSIGHTS.md` as the home for cross-module findings.

## Make it automatic in your project

Paste this into the project's `AGENTS.md` or `CLAUDE.md`:

```markdown
## Before answering

Before answering any question or starting any task, FIRST search the relevant
module's `docs/`, `specs/` and `INSIGHTS.md` (and `docs/specs/INSIGHTS.md`) for what
was asked about. These are curated and may already answer it in full. Only after
that, read the code. If a curated file answers the question, cite it instead of
re-deriving it from code.

## After finishing

Run the `engineering-insights` skill at the end of any non-trivial task. It records
what was learned into the `INSIGHTS.md` of the module you touched, after checking
that a similar entry isn't already there. **Do not skip this step.**

Skip only the writing, and only when nothing non-obvious came up - a typo or a
routine change is not an insight, and noise costs more than silence.
```

The two short lines the loop rests on are: **"Before answering: search
docs/specs/INSIGHTS.md first"** and **"After a non-trivial task run the
engineering-insights skill"**. Adjust the path to wherever your project keeps its
root insights file.

This plugin installs no hook. Making the loop automatic is done by those two
reminders; an optional `Stop` hook is described in the skill's `references.md` and
is yours to write, review and own.

## The ledger

The skill's wrap-up step runs `scripts/ledger.sh record <module> <recorded|none>`
and then `status`. The ledger lives in your project at
`.claude/insight-curator/ledger.tsv` (override the path with the `INSIGHTS_LEDGER`
environment variable). Recommended: commit it and add this line to `.gitattributes`
so parallel branches can both append:

```
.claude/insight-curator/ledger.tsv merge=union
```

When `status` prints `curation due`, run the `engineering-insights:insight-curator`
agent, pick the proposals you accept, apply them (nested, append-only), then run
`ledger.sh curated` to reset the counter. The agent cannot write the marker itself:
it has no `Bash` and no write tool.

## Security

`scripts/ledger.sh` has no network access, runs nothing on its own (no hooks), and
writes only the ledger file. Its `module` argument is validated to a repo-relative
path (no `..`, no absolute paths, no shell metacharacters). The agent is read-only.

## Install

```
claude plugin install engineering-insights@dev-digest-ai-marketplace
```

The plugin has no dependencies.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
