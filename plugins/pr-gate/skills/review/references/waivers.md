# Waivers

A gate with no escape hatch gets disabled the first time it is wrong at an inconvenient hour. A waiver is that hatch: narrow, recorded and self-limiting.

## What a waiver is

A decision that a specific confirmed finding does **not** block *this* change, with a reason a reviewer can read later. It is scoped to a **finding signature**, not to a rule in general:

```text
signature = <skill>/<rule> @ <path> :: <sha256(offending line, trimmed)[:12]>
```

Tying it to the line's content means the waiver disappears the moment the code changes.

## Where the ledger lives

In the **project**, in `.claude/reviews/waivers.md`: an append-only table the team can commit and review. Create it on the first waiver with this header:

```markdown
| date | signature | strikes | reason | by |
| --- | --- | --- | --- | --- |
```

Only the user can decide to waive. Propose a waiver; never add one on your own.

## How to waive

During stage 4, when a CONFIRMED CRITICAL is a deliberate, understood trade-off and the user agrees:

1. Append a row to the ledger (newest at the bottom).
2. Pass its signature to the stamp: `gate-stamp.mjs --write <verdict> --waivers <sig>[,<sig>]`. A waived CRITICAL is subtracted from the block decision but still printed in the report under **Waived**.

Never waive a Tier-1 deterministic failure (a red check is not a judgment call) or a committed secret (tripwire T3): fix those.

## The three-strike rule

A signature may be waived on **two** changes. The **third** time the same `<skill>/<rule> @ <path>` comes up (ignoring the line hash, since a recurring problem drifts across lines) the waiver is refused: three appearances is a pattern, not an exception. Count prior rows in the ledger; at two prior strikes the finding blocks and must be fixed or the rule changed.
