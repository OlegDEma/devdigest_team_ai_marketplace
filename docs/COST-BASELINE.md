# Cost baseline: `sdd-engineering` run-plan

How much one successful `sdd-engineering` workflow costs, what we changed to make it cheaper, and the gate that keeps the change from lowering quality.

## What is measured

**Workflow under test:** `/sdd-engineering:run-plan` on a fixed, approved plan: implementer → `architecture-reviewer` ‖ `security-reviewer` ‖ `plan-verifier` (plus the fix cycle, if needed). Spec and plan are written by the owner and are the same in every run, so only the plugin changes.

**Fixture:** [`docs/cost/fixture`](cost/fixture): a dependency-free Node project, feature `toCsv(rows, columns)` with 4 acceptance criteria (EARS), one lane, `npm test` as the check. It needs nothing from DevDigest.

**Run:** `scripts/cost/run-workflow.sh <label> [--plugin-dir <abs path>…]` copies the fixture into a clean directory and runs `claude -p "/sdd-engineering:run-plan plan:…"` (Sonnet 5.5 for the main session and all agents). `node scripts/cost/summarize.mjs <label>…` prints the table below from the CLI's JSON result.

**Cost:** `total_cost_usd` from `claude -p --output-format json` — main session plus every subagent, as priced by the CLI. Date of measurement: 2026-10-27.

**A run is successful when all of these hold:**

1. `npm test` in the resulting project is green (5/5: 4 new tests + the existing one);
2. the implementer and `plan-verifier` really ran as subagents (a session that implements the plan by hand does not count — this happened once with a wrong `--plugin-dir` and the run was discarded);
3. the verifier's verdict is `approve` with AC-1…AC-4 `Met`.

**Cost per successful workflow** = mean `total_cost_usd` of the successful runs of a variant (3 runs per variant).

## Baseline

`sdd-engineering` 1.1.0 (current `main`, four agents per run).

| Run | Agents | Cost, USD | Seconds | Successful |
| :- | :-: | -: | -: | :-: |
| v110_1 | 4 | 0.7386 | 82 | yes |
| v110_2 | 4 | 0.7131 | 88 | yes |
| v110_3 | 4 | 0.7379 | 71 | yes |
| **Mean** | | **0.7299** | | 3 / 3 |

Where the tokens go (run `v110_1`, prompt-side tokens from `workflow-retro`'s `collect.py`):

| Agent | Prompt-side tokens |
| :- | -: |
| main (orchestrator, 9 turns) | 590.8k |
| implementer | 135.3k |
| plan-verifier | 56.8k |
| architecture-reviewer | 122.3k |
| security-reviewer | 134.1k |

The orchestrator is mostly cheap cache reads. Every extra subagent, though, starts a fresh context and pays its own cache write, so the number of agents is the lever that is under the plugin's control.

For reference, the same measurement on 1.0.0 (three agents, no security reviewer; installed plugin, runs `base1`–`base3`): $0.5296, $0.5431, $0.5581, mean **$0.5436**. The 1.0.0 → 1.1.0 increase (+$0.19, +34%) is the always-on security reviewer.

## Optimization: skip the architecture review for a small single-layer diff

**Change** (`sdd-engineering` 1.2.0, `skills/run-plan/SKILL.md`, Step 2): `architecture-reviewer` is not launched when **all** of these hold: single lane; the implementer manifest touches ≤ 3 source files plus their tests; plan §6 puts every file in one layer; plan §10 names no layering or boundary risk. The report must say *architecture review skipped: small single-layer diff* so the owner can ask for the review. The security reviewer is **not** affected by this rule.

**Why this one:** a single new pure function in one layer gives the architecture reviewer nothing to check, yet it costs a whole agent (≈122k prompt-side tokens, one cache write). Changing a reviewer's `effort` or trimming the orchestrator's reads was tried first and made no measurable difference (see *Tried and rejected*).

| Run | Agents | Cost, USD | Seconds | Successful |
| :- | :-: | -: | -: | :-: |
| opt1 | 3 | 0.5842 | 80 | yes |
| opt2 | 3 | 0.6365 | 87 | yes |
| opt3 | 3 | 0.5824 | 76 | yes |
| **Mean** | | **0.6010** | | 3 / 3 |

| | Cost per successful workflow | Agents |
| :- | -: | :-: |
| Baseline (1.1.0) | $0.7299 | 4 |
| Optimized (1.2.0) | **$0.6010** | 3 |
| Change | **−$0.129 (−17.7%)** | −1 |

The spread inside a variant is about ±$0.03, so the saving is larger than the noise. The fixture is deliberately tiny; on a real feature the agents read more and the saving per skipped reviewer is larger in absolute terms, but the share depends on the project.

## Quality gate

The optimization is accepted only if all of these hold:

1. **No quality loss on the fixture:** 3 / 3 optimized runs are successful (tests green, verifier `approve`, AC-1…AC-4 `Met`). ✔ 3 / 3.
2. **The security review is unchanged:** the security reviewer ran in all 3 optimized runs, and it found the same real issue as in the baseline (SR-1: spreadsheet formula injection through `customer`, reported as a WARNING and left to the owner). ✔
3. **The skip is conditional, not blanket:** with the same fixture and one added line in plan §10 naming a layering risk (`T9`), the architecture reviewer **is** launched (run `gate1`: 4 agents, reviewer verdict "approve", boundary confirmed; the run also spent one fix round on SR-1, so its cost of $0.9865 is not comparable with the tables above). ✔
4. **The skip is visible:** every optimized report names the skipped review. ✔ 3 / 3.
5. **Not yet covered:** `claude plugin eval` cases for the 1.2.0 behaviour (a skip case and a "risk named → reviewer runs" case) are not written yet; until they exist the gate rests on the runs above.

If a later change fails any of these points, revert the rule.

## Tried and rejected

| Change | Result |
| :- | :- |
| `plan-verifier` `effort: high` → `medium` together with reading the plan header, §8, §10, §11 in one Bash call instead of two (tried as one change on 1.0.0) | mean $0.551 vs $0.544: no saving (the verifier is ≈5% of the tokens, one orchestrator turn is a cache read) |

## Reproduce

```bash
# baseline: current main (needs security-review next to sdd-engineering)
scripts/cost/run-workflow.sh v110_1 --plugin-dir "$PWD/plugins/sdd-engineering" --plugin-dir "$PWD/plugins/security-review"
node scripts/cost/summarize.mjs v110_1 v110_2 v110_3
```

Use `git stash`/`git checkout 6ccbcb6 -- plugins/sdd-engineering` to measure the 1.1.0 variant, and the branch tip for 1.2.0. Run directories land in `.cost-runs/` (git-ignored).
