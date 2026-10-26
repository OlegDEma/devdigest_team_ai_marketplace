---
name: architecture
description: >-
  Stack-neutral layered (onion / hexagonal / clean) architecture rules for
  backend and frontend code, usable both as design guidance and as review
  criteria. Use when planning or implementing a change that adds a route,
  handler, service, repository, adapter, page, feature, component or hook;
  when deciding where business logic, database access, external I/O, data
  fetching or validation belongs; when judging whether a module leaks
  infrastructure into its core or business logic into UI components; or when
  reviewing a plan, working tree or file list for layering violations. The
  project's own layer map is an input (from the plan, the conventions file
  such as CLAUDE.md or AGENTS.md, or inferred from the repo and confirmed).
  Trigger terms: architecture, onion, hexagonal, clean architecture, ports and
  adapters, layering, layer map, dependency direction, where should this go,
  route touching the database, service creating an SDK client, feature
  folders, business logic in components, data fetching in components,
  server-client boundary, import boundaries.
metadata:
  tags: architecture, onion, hexagonal, clean-architecture, ports-adapters, layering, frontend-structure, review
---

# Architecture

Business meaning sits in the center, I/O sits on the rim, and **every dependency
points inward**. On the frontend the same idea reads as **routes/pages →
features → shared UI → lib**: imports flow one way and UI components stay free
of business logic and raw data access.

This skill holds the **rules**. It does not hold any project's folder names:
the **layer map** that says which paths form which layer is an input you resolve
first (see below). The rules are the same whether the project uses Express,
Fastify, NestJS, Django, Spring, Go, React, Next.js or something else.

It is about **boundaries between layers**, not the craft inside one. For that,
use the sibling skills in this plugin: `engineering-paved-path:fastify-best-practices`
(routes/plugins), `engineering-paved-path:zod` (schemas at the boundary),
`engineering-paved-path:typescript-expert` (types),
`engineering-paved-path:react-best-practices` (component internals),
`engineering-paved-path:next-best-practices` (Next.js APIs),
`engineering-paved-path:react-testing-library` (tests),
`engineering-paved-path:security` (authn/authz, input handling).

## Step 1 — resolve the layer map (always first)

Resolve the project's layer map in this order and **say which source you used**:

1. **The caller's prompt or the plan** — a layer table, a code map, or a section
   naming which paths are domain, application, data access, infrastructure,
   presentation (and, for frontends, routes, features, shared UI, lib).
2. **The project's conventions file**, if one exists (`CLAUDE.md`, `AGENTS.md`,
   or an architecture doc / ADR they point to), plus any import-boundary checker
   config already in the repo (dependency-cruiser, eslint-plugin-boundaries,
   `import/no-restricted-paths`, import-linter, ArchUnit) — its rules *are* the
   intended map.
3. **Inferred from the repository** — folder names, the import graph, and where
   the persistence library, the HTTP framework and SDK clients are imported.
   An inferred map is an **assumption**: when you can talk to the user (planning,
   implementing), show it and get it confirmed before relying on it; when you
   cannot (read-only review), state it at the top of your output and treat
   findings that depend only on it as lower confidence.

For each layer the map needs: **paths**, **what it may import**, **what it must
not import**, plus the **composition root** (where concrete adapters are wired)
and any **known deviations** the project has already recorded. The template and
the full rule text are in [`references/rules.md`](references/rules.md); a filled
example is in [`references/example-layer-map.md`](references/example-layer-map.md)
(an example only — never assume a project matches it).

The project may merge, split or rename layers. Map its names onto the rules; do
not force its code into the template. **Where the project's documented
conventions and this skill disagree, the project wins** — consistency beats a
nicer template — unless the convention breaks a rule outright, which you report
rather than silently follow.

## The layers (generic shape, center → rim)

| Layer | Holds | May import | Must NOT import |
| --- | --- | --- | --- |
| **Domain** (core) | pure business rules, domain types, port interfaces | other domain code, shared contract types | persistence library, HTTP/UI framework, SDK clients, adapters, filesystem/env/network, anything outward |
| **Application** | use-case orchestration (services, executors, handlers of commands) | domain, port interfaces, its own repositories | HTTP request/response objects, concrete adapters, SDK clients |
| **Data access** | repositories / DAOs / gateways over storage | persistence library, DB schema, domain types | HTTP framework, services, other modules' data-access internals |
| **Infrastructure** | adapters implementing ports, DI/composition root, config, DB setup | anything inward (it implements the ports) | — (this is the rim) |
| **Presentation** | routes, controllers, handlers, CLI/queue entry points | its service, boundary schemas/contracts | persistence library directly, SDK clients |

Frontend (any component framework):

| Layer | Holds | May import | Must NOT import |
| --- | --- | --- | --- |
| **Routes / pages** | route files, page entry points, layouts | features, shared UI, lib | — (top of the graph); but keep them thin |
| **Features** | domain-specific components, hooks, API calls, types | shared UI, lib, its own internals | other features' internals, routes |
| **Shared UI** | domain-agnostic components, design-system primitives | lib | features, routes |
| **Lib** | API client, query setup, config, purpose-named helpers | other lib modules | UI, features, routes |

## The rules

Backend / core rules (names are stable; reviewers cite them):

1. **A1 Direction** — dependencies point inward, always. An inner layer never
   names an outer one; the domain imports nothing outward.
2. **A2 Persistence confinement** — the persistence library (ORM, query
   builder, driver, schema module) is imported only in the data-access layer.
3. **A3 External I/O through ports** — services never construct SDK or network
   clients. The port (interface) lives inward, the adapter (implementation) on
   the rim, and they are wired at the composition root. Depend on interfaces,
   not concretions; this is also the test seam.
4. **A4 Validation at the edge** — input is validated and output shaped at the
   presentation boundary with the project's declared schemas (route schema or
   equivalent); inner layers trust their types and do not re-validate.
5. **A5 Orchestration in the application layer** — tenancy, unit-of-work /
   transaction boundaries, sequencing several ports, background jobs live in a
   service. Routes translate transport; repositories translate rows; the pure
   algorithm lives in the domain.
6. **A6 Contracts first** — a contract shared across a boundary (schemas/types
   used by more than one side or package) has one source of truth, changes
   there first, and drives both validation and serialization; every copy and
   consumer is updated consistently. Prefer additive changes.
7. **A7 Thin modules are a decision** — skipping the service or repository
   layer is fine only for a pure read/proxy with no orchestration and no
   persistence of its own, and the choice is recorded. The moment it writes or
   coordinates, it earns the full split.

Frontend rules:

- **F1 One-way imports** — routes → features → shared UI → lib. Shared code
  never imports features; features do not import each other's internals.
- **F2 Thin routes/pages** — route files compose from features; no business
  logic, no reusable components defined in them.
- **F3 No business logic in UI components** — logic lives in custom hooks and
  pure functions; components are mostly presentational and props-driven.
- **F4 Data fetching at the edge** — network calls go through the project's
  API layer and query hooks (or Server Components / a server-only data-access
  layer); never ad-hoc `fetch` inside a component; fetched data is not copied
  into local state.
- **F5 Colocate, promote on the second use** — code starts inside the feature
  that needs it and moves to shared only when a second feature needs it.
- **F6 Feature public API** — a feature exposes one entry point; others do not
  deep-import its internals; avoid broad barrels for prettier paths.
- **F7 State placement** — server cache vs UI state; colocate state, lift only
  when shared, reach for Context/global only when prop-drilling hurts.
- **F8 server-client boundary** (RSC frameworks) — server by default, client
  directive only at interactive leaves, server-only modules guarded; sensitive
  reads go through a server-only data-access layer with auth checks returning
  minimal DTOs; every server action authenticates, authorizes and validates.
- **F9 One typed config** — env/config read once in a typed, validated module,
  never scattered `process.env` reads (applies to backends too).

Full text, rationale and violation signals for every rule:
[`references/rules.md`](references/rules.md).

## "Where does this code go?" — decision path

```
Pure business rule / algorithm with no I/O?
  → domain. Inject any side effect as a port parameter.
Reads/writes the database?
  → a repository in the data-access layer. Nowhere else.
Talks to an external system (HTTP API, LLM, cloud SDK, git, filesystem, queue)?
  → declare a port interface inward, implement an adapter on the rim,
    wire it at the composition root, consume the interface.
Coordinates several of the above for one use case (tenancy, ordering,
transactions, background work)?
  → a service / executor in the application layer.
Parses or shapes transport (HTTP request/response, status codes, SSE, CLI args)?
  → the presentation layer, and only there.
Pure row→DTO / value transform?
  → a pure helper next to its consumer (no I/O, no DB handle).

Frontend:
Route entry? → thin route/page that renders a feature.
Used by one feature? → inside that feature (component, hook, api, types).
Used by two or more features? → shared UI (components) or lib (logic/helpers).
Stateful or business logic? → a custom hook or pure function, not the component.
Network call? → the API layer + a query hook (or a server-only data-access module).
```

When two layers both seem plausible, choose the **more inward** home that still
compiles without importing outward — that is almost always correct.

## How to use this skill by role

**Designing / planning.** Resolve the layer map (Step 1). For every new or
changed file, name its layer, what it will import, and which rule it satisfies;
if a step needs a new port, contract or composition-root wiring, make that its
own step ordered before its consumers (contracts first, A6). Record any thin
module (A7) and any deliberate new boundary crossing as an explicit decision.
If the project has a boundary checker, plan the rule change in the same step as
the crossing; never plan a blanket ignore.

**Implementing.** Place code by the decision path. Do not introduce an outward
import, an ORM import outside data access, an SDK client in a service, or a
`fetch` in a component. If the plan forces a crossing it did not record, stop
and report it instead of improvising. Do not "fix" unrelated pre-existing
deviations in the same change unless the plan says so.

**Reviewing.** Work through
[`references/review-checklist.md`](references/review-checklist.md): rules in
order, every finding with a rule ID, severity
(`CRITICAL | WARNING | SUGGESTION`), quoted evidence as `path:line`, the
mechanism, and where the code belongs. Known deviations the project already
recorded are reported only when the change extends or worsens them. An empty
findings list is the correct output for sound work.

## Companion files

- [`references/rules.md`](references/rules.md) — the rule catalogue: layer-map
  template, full text, rationale and violation signals for A1–A7 and F1–F9,
  module tiers, the frontend reference layouts.
- [`references/review-checklist.md`](references/review-checklist.md) —
  enforcement and review: ordered checklist, evidence quoting, search recipes
  parameterized by the layer map, optional mechanical checkers, the
  migrate-a-leaky-module recipe, the finding format.
- [`references/example-layer-map.md`](references/example-layer-map.md) — one
  worked example (a generic Node.js backend + React frontend). **Example only.**
- [`references/frontend-react.md`](references/frontend-react.md) and
  [`references/frontend-nextjs-app-router.md`](references/frontend-nextjs-app-router.md)
  — deeper frontend organization guidance with citations.
- [`references/sources.md`](references/sources.md) — why each rule holds, and
  the reading list.
