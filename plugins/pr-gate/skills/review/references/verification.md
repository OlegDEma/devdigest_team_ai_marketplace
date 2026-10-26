# Verification: confirm every CRITICAL before it blocks

The biggest lever on trust. A gate that blocks on a guess gets disabled; a gate that blocks only on confirmed, reproducible problems gets respected. No candidate CRITICAL blocks until a **separate** verifier agent has tried to disprove it and failed.

Run this once per candidate CRITICAL (deterministic Tier-1 failures are already facts; skip them). Batch CRITICALs that share a file into one verifier.

## Why a separate agent

The reviewer that raised the finding is primed to believe it. A fresh agent, told its job is to break the claim, catches the missing context: the mitigation on the next line, the input that is actually server-controlled, the guard in a parent component.

## Verifier brief (template)

> You are adversarially verifying **one** candidate CRITICAL from a pre-PR review. Your default assumption is that it is **wrong**. Try to disprove it. You are read-only: do not edit files and do not run state-changing commands.
>
> The finding: `<file, line, skill/rule, evidence, failure_scenario, fix>`.
>
> 1. **Read the real code** around `file:line`: the whole function, the symbols it calls, the callers, any parent guard or middleware. Do not trust the quoted evidence; re-read it in the file.
> 2. **Trace the data flow.** Confirm the triggering input or state is reachable **on the changed code** and is attacker- or caller-controlled — not a constant, an env var, a test fixture, a dead branch or a framework-mitigated path.
> 3. **Check upstream mitigations**: validation, auth middleware, type narrowing, output escaping, a schema at the edge.
> 4. **Reproduce the failure scenario** concretely: name the exact input or state and the resulting wrong output or crash. If you cannot construct one, it is not a CRITICAL.
>
> Return JSON only: `{verdict: "CONFIRMED" | "REFUTED", confidence: "high"|"medium"|"low", reproduction: "<concrete input -> bad outcome, or why none exists>", note: "<mitigation found / context the reviewer missed, if any>"}`

## Applying the verdict

- **CONFIRMED (high)**: stays CRITICAL and blocks in blocking mode. Carry the `reproduction` into the report.
- **CONFIRMED (medium)**: CRITICAL, labelled "confirmed, reachability probabilistic"; still blocks.
- **REFUTED**, or no reproduction can be constructed: downgrade to WARNING labelled "flagged, not confirmed — verify manually" and include the verifier's `note`. Never drop it silently.

## The grounding bar (applies to reviewers too)

A finding at any severity carries:

- **evidence**: the actual offending line(s), quoted from the file.
- **failure_scenario**: a concrete input or state leading to a wrong output, crash or violation. "Violates rule X" is not a scenario.
- **fix**: the specific change, in this project's idiom.

Findings that cannot meet the bar are downgraded one level (CRITICAL to WARNING, WARNING to SUGGESTION). This one rule removes most noise before it reaches the user.
