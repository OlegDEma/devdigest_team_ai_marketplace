# Enforcement and review checklist

How to check the rules in `rules.md` against real code: an ordered checklist,
how to quote evidence, search recipes driven by the layer map, optional
mechanical checkers, the recipe for un-leaking a module, and the finding format.

Import discipline that lives only in a document rots. Enforcement is (a) a
mechanical checker when the project has one, (b) a review against this
checklist, and (c) the project's PR gate if it has one.

---

## 1. Before you check anything

1. **Resolve the layer map** (SKILL.md, Step 1) and write down its source:
   caller/plan, conventions file, checker config, or *inferred*.
2. **Read the known-deviations list** if the plan, conventions file or an
   architecture doc has one. Those are reported only when the change extends or
   worsens them.
3. **Fix the target**: a plan, a working tree, a named file list, or a diff.
   Judge what *this change* introduced or worsened; pre-existing problems in
   code the change does not touch go in a separate "pre-existing" list, not in
   findings.
4. **Note mechanical enforcement**: is there a boundary checker config in the
   repo? If yes, its rules are evidence of the intended map. If no, say so once;
   never tell anyone to "run the boundary check" when none exists.

## 2. The checklist (in order)

Stop descending only when a rule clearly does not apply to the target.

| # | Rule | Question | Where to look |
| --- | --- | --- | --- |
| 1 | A1 Direction | Does any inner layer import an outer one? Does the domain do I/O other than through injected ports? | imports at the top of domain and application files |
| 2 | A2 Persistence | Is the persistence library or schema module imported outside the data-access paths? | imports of the ORM/driver/schema in routes, services, domain |
| 3 | A3 External I/O | Does a service, route or domain file construct or import an SDK/network client or a concrete adapter? Does it read secrets from env directly? | `new <Client>(`, SDK imports, adapter imports, env reads |
| 4 | A4 Validation | Are inputs validated at the edge with the declared schemas (route schema or one boundary function)? Is unvalidated external data passed inward? Is it re-validated inward? | route declarations, handler bodies, `JSON.parse`, queue consumers |
| 5 | A5 Orchestration | Is tenancy, transaction, unit-of-work, multi-port sequencing or background work in the application layer — not in a route or a repository? | handler bodies longer than "validate → call service → shape response"; repositories calling services/APIs |
| 6 | A6 Contracts | Did a shared contract change at its single source of truth first, with every copy and consumer updated consistently? | contract/schema files, their copies, consumers, tests |
| 7 | A7 Thin modules | Does a module that skips service/repository meet the "pure read/proxy" bar, and is the choice recorded? | routes-only modules that write or coordinate |
| 8 | F1 One-way imports | Does shared UI or lib import a feature? Does a feature deep-import another feature? | imports in shared folders and across feature folders |
| 9 | F2 Thin routes | Do route/page files contain business logic or reusable components? | route files |
| 10 | F3 Logic out of UI | Is business logic or data transformation inside component bodies instead of hooks/pure functions? | component files |
| 11 | F4 Data at the edge | Is there `fetch`/HTTP-client use inside a component while the project has an API layer? Is fetched data copied into local state? | component files, `useEffect` + `fetch`, `useState(data)` |
| 12 | F5–F7 Placement and state | Is single-use code promoted to shared prematurely, or shared code living inside one feature? Is server cache hand-rolled? | shared folders, new hooks, state declarations |
| 13 | F8 Server-client | In RSC frameworks: client directive too high, server-only code reachable from a client file, sensitive reads without a data-access layer, server actions without authn/authz/validation? | client directives, action files, data-access modules |
| 14 | F9 Config | Are env reads scattered instead of going through one typed config module? | env reads outside the config module |

For a **plan** (no code yet), ask the same questions of each planned file:
does its stated layer match the layer map, do its planned imports respect the
rules, is every new port/contract/composition-root change its own step ordered
before its consumers, and is every thin module or new crossing recorded?

## 3. Quoting evidence

Every finding carries evidence a reader can verify without re-running your
search:

- **Location as `path:line`** (or `path:start-end`), path relative to the repo
  root. For a plan, cite the plan file and the step ID (`docs/plans/2026-01-15-orders.md:42`, step B3).
- **The quoted line(s)**, verbatim, in backticks — the import statement, the
  `new` call, the query, the handler body excerpt. Keep it to the lines that
  prove the point.
- **The layer-map entry** that makes it a violation: which layer this path is
  in, and the source of the map (`CLAUDE.md:18`, the plan's layer map, or
  "inferred").
- **The mechanism**: which call path or input triggers the problem and what goes
  wrong (cannot be tested without a network; a schema change silently bypasses
  validation; the domain now depends on the framework's release cycle).
- **Where it belongs**: one line naming the layer and, if obvious, the file —
  not a patch.

A grep hit is a lead, not a verdict. Open the file and confirm it is a real
cross-layer import, not a comment, a type-only import of a shared contract, a
test, or generated code.

## 4. Search recipes (parameterized by the layer map)

Replace the placeholders with the project's values: `<DOMAIN>`, `<APP>`,
`<DATA>`, `<PRESENTATION>`, `<SHARED_UI>`, `<FEATURES>` are path globs from the
layer map; `<ORM>` is the persistence package(s); `<HTTP>` is the HTTP framework
package(s); `<SDKS>` is the external SDK packages; `<SCHEMA>` is the DB schema
module. Use the `Grep` tool or `grep -rnE` with the same patterns.

```bash
# A1 — domain reaching outward (framework, ORM, SDKs, or outer-layer paths)
grep -rnE "from ['\"](<HTTP>|<ORM>|<SDKS>)" <DOMAIN>
grep -rnE "from ['\"].*(<APP>|<DATA>|<PRESENTATION>)" <DOMAIN>

# A2 — persistence outside the data-access layer
grep -rnE "from ['\"](<ORM>|.*<SCHEMA>)" <PRESENTATION> <APP> <DOMAIN>

# A3 — a service or route constructing an external client
grep -rnE "new [A-Z][A-Za-z]*(Client|SDK|Api)\(" <APP> <PRESENTATION>
grep -rnE "from ['\"](<SDKS>)" <APP> <PRESENTATION>
grep -rnE "process\.env\." <APP> <DOMAIN>

# A4 — hand-rolled parsing deep inside handlers
grep -rnE "\.parse\((req|request)\.(body|query|params)" <PRESENTATION>

# A5 — HTTP types leaking into services or repositories
grep -rnE "from ['\"](<HTTP>)" <APP> <DATA>

# F1 — shared code importing features; features deep-importing each other
grep -rnE "from ['\"].*features/" <SHARED_UI>
grep -rnE "from ['\"].*features/[^/'\"]+/[^'\"]+" <FEATURES>

# F4 — raw network calls inside components
grep -rnE "\bfetch\(|axios\.(get|post|put|patch|delete)\(" <FEATURES> <SHARED_UI>
```

Exclude vendored code, generated code, build output, `node_modules` and any
cloned or copied repositories from every search, so you do not judge the wrong
file.

## 5. Mechanical checkers (optional, project-owned)

If the project wants the boundaries enforced in CI, these tools express the
layer map as rules. Recommend adding one only as a plan step; never claim one
exists without seeing its config.

| Ecosystem | Tool | Expresses |
| --- | --- | --- |
| JS/TS | dependency-cruiser (`.dependency-cruiser.cjs`) | `forbidden` rules `from` a path `to` a path or package |
| JS/TS | eslint-plugin-boundaries, `import/no-restricted-paths` | element types and allowed imports, in lint |
| Python | import-linter | layers and forbidden contracts |
| JVM | ArchUnit | layer rules as tests |
| Go | `depguard` / custom `go list` checks | forbidden imports per package |

A dependency-cruiser sketch, with placeholders from the layer map:

```js
// .dependency-cruiser.cjs — one forbidden rule per architecture rule
module.exports = {
  forbidden: [
    { name: 'A1-domain-stays-pure', severity: 'error',
      from: { path: '<DOMAIN_REGEX>' },
      to: { path: '<APP_REGEX>|<DATA_REGEX>|<PRESENTATION_REGEX>|^(<HTTP>|<ORM>|<SDKS>)($|/)' } },
    { name: 'A2-persistence-only-in-data-access', severity: 'error',
      from: { path: '<SRC_REGEX>', pathNot: '<DATA_REGEX>|<INFRA_REGEX>' },
      to: { path: '^(<ORM>)($|/)|<SCHEMA_REGEX>' } },
    { name: 'A3-no-sdk-or-adapter-in-application', severity: 'error',
      from: { path: '<APP_REGEX>|<DOMAIN_REGEX>' },
      to: { path: '^(<SDKS>)($|/)|<ADAPTERS_REGEX>' } },
    { name: 'A5-no-http-in-application-or-data', severity: 'error',
      from: { path: '<APP_REGEX>|<DATA_REGEX>' },
      to: { path: '^(<HTTP>)($|/)' } },
  ],
  options: { tsPreCompilationDeps: true, exclude: { path: 'node_modules|\\.test\\.' } },
};
```

Rules of use:

- A deliberate new crossing changes the ruleset **in the same change** as the
  code, with a comment explaining why — never a blanket ignore.
- A tracked, temporary exception is a `warn` scoped to the exact path, listed
  as a known deviation, not a deleted rule.

## 6. Recipe — migrate a leaky module

For a route that queries the database and orchestrates inline:

1. **Create the data-access layer.** Add a repository for the module. Move every
   inline query into named methods (`listByOwner(id)`, `upsertMany(rows)`,
   `latestScores(ids)`). Only these import the persistence library.
2. **Create the application layer.** Add a service. Move orchestration (sync
   loops, backfills, aggregation across sources, transactions) into service
   methods that call the repository and ports. Keep pure reductions in a
   helpers file so they are unit-testable without a DB or a container.
3. **Thin the route.** It keeps: the boundary schema, auth/tenancy context,
   one service call, response shaping, error mapping. It no longer imports the
   persistence library.
4. **Confirm the boundary closed.** The checker (if any) passes without the
   exception; the search recipes are clean for the module.
5. **Record it.** Remove the module from the known-deviations list.

Behaviour does not change in this refactor; logic only moves to the layer that
owns it.

## 7. Finding format

Severity vocabulary is exactly `CRITICAL | WARNING | SUGGESTION`; only
CRITICAL blocks.

```markdown
### [WARNING] A2 Persistence confinement — query in a route handler
- Evidence: `src/http/orders.routes.ts:14` — `import { db } from '../db/client'`
  and `src/http/orders.routes.ts:41-48` — `await db.insert(orders).values(...)`
- Layer map: `src/http/**` = presentation (source: `CLAUDE.md:22`)
- Mechanism: the handler writes directly; the order-creation rule cannot be
  tested without a database and is duplicated by the import job.
- Belongs in: a repository method in the data-access layer, called from the
  orders service.
```

Severity guidance (anti-inflation):

- **CRITICAL** — an inward rule is broken in a way that blocks the stated
  requirements or correctness: the domain imports the framework or DB, an
  unvalidated external input reaches the core, a server action or data-access
  path skips authorization.
- **WARNING** — a real boundary leak with a concrete mechanism that does not
  block the requirement (query in a route, SDK client in a service, logic in a
  component, deep import across features).
- **SUGGESTION** — placement or organization that would make the next change
  easier (premature promotion to shared, a barrel that hurts tree-shaking).
- A speculative finding is at most a WARNING. A finding without quoted
  evidence, a mechanism and "belongs in" drops one level. A finding that rests
  only on an **inferred** layer map is at most a WARNING. If you would dismiss
  it as a likely false positive, do not report it.
- Flag only gaps that affect correctness or the stated requirements; an empty
  findings list is the right answer for sound work.

Also list the rules you checked that **held** (one line each) and the
**pre-existing, not introduced here** deviations with where they are recorded.
