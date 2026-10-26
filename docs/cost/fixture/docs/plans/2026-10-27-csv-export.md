# CSV export of the report — Implementation plan

> Spec: [`2026-10-27-csv-export`](../specs/2026-10-27-csv-export.md) (`Status: approved`, rev 1) — read 2026-10-27.
> Status: **approved** (rev 1, 2026-10-27). Execution mode: **single**.
> Scope: `src/`, `test/`. ACs are owned by the spec; this plan only maps them.

## 1. Requirements (verified)
| R | Requirement, restated | Spec id | Covered by steps | Verified by |
|---|-----------------------|---------|------------------|-------------|
| R1 | Header line plus one line per row, column order, `\r\n` joins | AC-1 | A1, A2 | V2 |
| R2 | Quote values with comma, quote or line break; double inner quotes | AC-2 | A1, A2 | V2 |
| R3 | `null`/`undefined` become empty fields | AC-3 | A1, A2 | V2 |
| R4 | Empty `columns` throws `columns must not be empty` | AC-4 | A1, A2 | V2 |

### Owner answers
- none

### Recommendations
none

## 2. Implementation decisions
| # | Decision (how, not what) | Consequence |
|---|--------------------------|-------------|
| D1 | One pure function, no streaming, no dependency | Fits the conventions file; large exports are out of scope |

## 3. What already exists — do not rebuild
| Layer | Already there | File |
|-------|---------------|------|
| rows | `buildReport(orders)` returns the rows to export | `src/report.js:2` |

### Code map — files this change touches
| File | Why it changes | Anchor |
|------|----------------|--------|
| `src/csv.js` | new: `toCsv` | — |
| `test/csv.test.js` | new: tests for AC-1..AC-4 | `test/report.test.js:1` (style) |

## 4. Data model
n/a — no persistent data changes.

## 5. Contracts
`toCsv(rows: object[], columns: string[]): string` in `src/csv.js`; no other copy exists.

## 6. Backend and services
`src/csv.js` — pure function, no I/O.

## 7. User interface
n/a

## 8. Execution mode & agent lanes
| Lane | Agent | Phases | Files owned | Waits on | Checkpoint |
|------|-------|--------|-------------|----------|------------|
| L1 | sdd-engineering:implementer | A | `src/csv.js`, `test/csv.test.js` | — | V1 |
| L2 | main session runs this: architecture-review:architecture-reviewer ‖ sdd-engineering:plan-verifier | — | diff | L1 | reports |

## 9. Implementation plan
### Phase A — toCsv
| # | Step | Files | Skill | AC |
|---|------|-------|-------|-----|
| A1 | Add `toCsv` with quoting, null handling and the empty-columns error | `src/csv.js` | `none` | AC-1, AC-2, AC-3, AC-4 |
| A2 | Add tests, one per AC, in the style of `test/report.test.js` | `test/csv.test.js` | `none` | AC-1, AC-2, AC-3, AC-4 |

## 10. Risks & gotchas
- **T1 Line endings** — the spec requires `\r\n`; assert it literally in the test.

## 11. Verification
| # | Command | Source | Expected | AC |
|---|---------|--------|----------|----|
| V1 | `npm test` | `package.json` script `test` | all pass | — |
| V2 | `node --test test/csv.test.js` | `package.json` | 4+ tests pass | AC-1..AC-4 |

## 12. Open questions & recommendations
- none
