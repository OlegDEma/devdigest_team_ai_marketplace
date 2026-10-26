# Engineering Insights - references and rationale

## What each section means

Module files carry *Decisions*, the root file carries *Session Notes*; the other
meanings are shared. Pick the one that fits; never invent a new heading.

| Section | Holds | Scope |
|---|---|---|
| **Decisions** | A deliberate choice, why, and the rejected alternative | modules |
| **What Works** | An approach or pattern that proved effective and is not obvious | all |
| **What Doesn't Work** | A failed approach, dead end or antipattern, **with why** | all |
| **Codebase Patterns** | A project-specific convention, architecture or naming rule | all |
| **Tool & Library Notes** | A quirk, gotcha or useful behavior of a dependency | all |
| **Recurring Errors & Fixes** | An error seen more than once and its exact fix | all |
| **Session Notes** | A dated cross-module summary of a session's outcome | root |
| **Open Questions** | Something unresolved that needs investigation | all |

## Routing recap

One insight, one file. Module-internal findings go in that module's `INSIGHTS.md`
(nearest ancestor directory that has one); findings about how modules interact, a
shared contract, repo scripts, CI or root config go in the root `INSIGHTS.md`.

## Design rationale

- **Fixed sections, append-only, dated, Evidence-cited.** Structure keeps the file
  loadable as context and diffable in git; Evidence keeps it honest.
- **The cold-read test** separates a lesson ("`Promise.all()` times out past 30
  items here - batch 10 with `allSettled()`") from noise ("promises can be tricky").
- **Correction-by-nesting, never edit.** In a team, editing another person's entry
  causes merge conflicts and silently erases a lesson; a nested dated correction
  preserves the history and surfaces the conflict.
- **Human-reviewed draft.** The wrap-up does most of the work; a periodic human
  pass (prompted by the ledger, prepared by `insight-curator`) consolidates and
  resolves contradictions. Past about 200 entries, split by domain.
- **Ledger in the project, not in the plugin.** The plugin directory changes with
  every update; `.claude/insight-curator/ledger.tsv` lives with the repo and is
  tracked in git. Add `.claude/insight-curator/ledger.tsv merge=union` to
  `.gitattributes` so parallel branches can both append.

## Optional automation upgrade - a `Stop` hook (not installed)

Description-based triggering plus the `AGENTS.md` reminder and manual
`/engineering-insights` is the default because auto-firing at session end is
unreliable on its own. A heavier option is a `Stop` hook in the project's
`.claude/settings.json` that runs a capture script of the project's own when a
session ends. This plugin ships no hook; adding one is standing configuration the
project owner must write, review and own (see the marketplace security guide for
script review).
