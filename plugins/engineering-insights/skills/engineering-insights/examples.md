# Engineering Insights - examples

A good/bad pair per section. The through-line: **could someone reading the code
figure this out without the note?** If yes, it is noise. Every good entry carries an
exact symbol, file or limit **and** an exact remedy, plus Evidence. File names below
are illustrative.

## Decisions (module files only)

A deliberate choice plus why plus what was rejected. Not "we use X" but why X over Y,
here.

- Bad: `- **2026-09-15** - We use Zod for validation.` Visible in every schema file.
- Good: `- **2026-09-15** - Request and response share ONE schema per contract in
  shared/contracts/ - it validates the body on the way in and serializes on the way
  out. Rejected separate DTO types: they drift. Change the contract there first, then
  consumers. Evidence: shared/contracts/knowledge.ts.`

## What Works

- Bad: `- **2026-09-15** - Postgres works fine locally.` Nothing actionable.
- Good: `- **2026-09-15** - The vector extension installs against postgresql@17, not
  @16: brew install postgresql@17 pgvector links the control file into @17, so
  migration 0000's CREATE EXTENSION vector runs. Evidence: docker-compose.yml:12.`

## What Doesn't Work

The most-skipped and most-valuable section: a dead end with the reason.

- Bad: `- **2026-09-15** - Editing shared types is risky.` No path, no mechanism.
- Good: `- **2026-09-15** - Editing client/src/vendor/shared/ alone silently desyncs
  the client: it is a hand copy of server/src/vendor/shared/ with no sync script and
  already lags in 5 files. Edit the server copy first, then re-copy. Evidence:
  diff -rq server/src/vendor/shared client/src/vendor/shared.`

## Codebase Patterns

- Bad: `- **2026-09-15** - The repo has some scaffolding.` Which? Where?
- Good: `- **2026-09-15** - Feature flags are read only through config/flags.ts;
  reading process.env.FLAG_* elsewhere bypasses the test override. Evidence:
  config/flags.ts:8, config/flags.test.ts:20.`

## Tool & Library Notes

- Bad: `- **2026-09-15** - The ORM can be finicky with migrations.` Folklore.
- Good: `- **2026-09-15** - Migrations do not run on boot; dev.sh never calls
  db:migrate. "relation ... does not exist" at startup means the step was skipped,
  not a schema bug - run the db:migrate script. Evidence: scripts/dev.sh.`

## Recurring Errors & Fixes

- Bad: `- **2026-09-15** - Sometimes runs get stuck.` No symptom, no fix.
- Good: `- **2026-09-15** - A job stuck in "running" after a crash is reaped on next
  boot - it is a dead process, not a logic bug. Restart the service instead of
  chasing it in code. Evidence: jobs/reaper.ts:31.`

## Session Notes (root file only)

A dated cross-module summary. Use sparingly: only when the arc spanned modules and
matters later.

- Bad: `- **2026-09-15** - Did some work on the reviewer.` Untraceable.
- Good: `- **2026-09-15** - Wired the skills path end-to-end: the executor now passes
  skills into the review call, so the trace drawer's skills block renders. Touched
  server and client. Evidence: server/src/runs/executor.ts:77.`

## Open Questions

- Bad: `- **2026-09-15** - The code could be better.` Not a question.
- Good: `- **2026-09-15** - Is the client's vendor/shared meant to be generated?
  There is no sync script and it lags the server copy. Evidence: diff -rq
  server/src/vendor/shared client/src/vendor/shared.`

## Correcting an entry (never delete)

Nest a dated sub-bullet under the original instead of rewriting it:

```
- **2026-08-05** - No package has a lint setup ... Evidence: ...
  - **2026-08-05** - Partly stale the same day: server/ now has a lint script
    but no config file. Evidence: server/package.json:11.
    - **2026-08-05** - Resolved for three of four packages ... Evidence:
      server/eslint.config.mjs.
```

The chain stays readable, the history survives, and no one's lesson is silently
overwritten.
