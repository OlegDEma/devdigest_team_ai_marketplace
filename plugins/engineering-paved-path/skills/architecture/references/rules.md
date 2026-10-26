# Rule catalogue

The generic rules behind `../SKILL.md`, with rationale and the signals that show
a violation. Rule IDs (A1–A7, F1–F9) are stable: plans, implementers and
reviewers cite them. Nothing here names a real project's folders; apply the
rules through the project's **layer map**.

## Contents

1. Layer-map template
2. Backend / core rules A1–A7
3. Module tiers
4. Frontend rules F1–F9
5. Frontend reference layouts
6. What is *not* a violation

---

## 1. Layer-map template

Fill this from the plan, the conventions file, a boundary-checker config, or by
inference (then confirm). Keep it in the plan or the conventions file so the
next person does not re-infer it.

```markdown
## Layer map

Source: <plan | CLAUDE.md / AGENTS.md section | checker config | inferred, confirmed by <who> on <date>>

| Layer | Paths (globs) | May import | Must NOT import |
| --- | --- | --- | --- |
| Domain | ... | ... | ... |
| Application | ... | ... | ... |
| Data access | ... | ... | ... |
| Infrastructure | ... | ... | ... |
| Presentation | ... | ... | ... |
| Routes / pages (frontend) | ... | ... | ... |
| Features (frontend) | ... | ... | ... |
| Shared UI (frontend) | ... | ... | ... |
| Lib (frontend) | ... | ... | ... |

Composition root: <file(s) that wire concrete adapters>
Persistence library: <ORM / query builder / driver and its schema module>
Boundary schemas: <validation library and where shared contracts live>
Mechanical enforcement: <checker + config path, or "none">

Known deviations (do not report unless worsened):
- <path> — <which rule> — <why it is tolerated / migration plan>
```

Rows that do not apply (no frontend, no separate data-access layer) are removed,
not left empty. A merged layer (for example "service + repository in one file
for thin modules") is written down as such, with the A7 justification.

---

## 2. Backend / core rules

### A1 Direction — dependencies point inward

An outer layer may depend on any inner layer; an inner layer may never name an
outer one. The domain is the center: it compiles and runs without the outer
layers, and its only side effects arrive as injected ports.

- **Why:** the stable part (business meaning) must not change when the volatile
  part (framework, database, vendor) changes. This is the shared core of Onion,
  Hexagonal and Clean architecture.
- **Violation signals:** a domain file importing the HTTP framework, the ORM,
  the DB client, an adapter, the config/env module, or any application or
  presentation file; a domain function that reads files, the clock or the
  network directly instead of receiving a port or a value.
- **Litmus test:** the domain can be unit-tested with fakes for its ports and
  nothing else.

### A2 Persistence confinement

The persistence library (ORM, query builder, DB driver) and the DB schema
module are imported only in the data-access layer (repositories / DAOs /
gateways).

- **Why:** a repository is an abstraction over storage that decouples data
  access from business logic and makes the dependency-inversion seam possible.
- **Violation signals:** a route/controller or service importing the ORM or the
  schema module; a handler calling `db.select/insert/update/delete` (or the
  equivalent) inline; the domain importing persistence types.
- **Allowed:** row types derived from the schema may be re-exported through the
  data-access layer's public surface so other modules never reach into another
  module's data internals.

### A3 External I/O only through ports

A service never does `new SomeSdkClient()`. It asks for a capability by its
**interface** (port). The interface lives in an inner layer (or a shared
contracts package); the implementation (adapter) lives on the rim; they are
wired in one place, the **composition root** (a container, a factory module, a
framework DI module, or plain constructor arguments).

- **Why:** dependency inversion; the application layer stays independent of
  vendors, secrets come from one place, and tests inject fakes without a
  network.
- **Violation signals:** an SDK/HTTP/cloud/LLM client constructed or imported in
  a service, the domain, or a route; an API key read from `process.env` (or the
  equivalent) inside a service; an inner layer importing a concrete adapter
  class instead of its interface.
- **Note:** a DI-container library is not required. Hand-rolled inversion
  (constructor arguments, a plain container object with getters) satisfies the
  rule equally; the boundary is the import, not the decorator.

### A4 Validation at the edge

Input is validated and translated at the presentation boundary before it
reaches the core; output is shaped there too. Use the project's declared
schemas, ideally through the framework's route-schema mechanism (or an
equivalent single boundary function), so invalid input is rejected before the
handler body runs.

- **Why:** the core can trust its types; validation happens once; error
  responses are uniform.
- **Violation signals:** a handler that hand-parses `request.body` deep inside
  its logic or passes unvalidated input to a service; a service or repository
  re-validating data that was already parsed at the edge; external data
  (`JSON.parse`, queue messages, env, third-party responses) used without
  parsing.
- **Allowed exception:** a tolerant parse of an optional or legacy body,
  documented where it happens.

### A5 Orchestration in the application layer

Use-case coordination lives in a service (or an executor extracted from it for
heavy background work): resolving tenancy, creating unit-of-work records,
transaction boundaries, sequencing several ports and repositories, fire-and-
forget jobs, observability around them. The *pure* algorithm lives in the
domain. Routes translate transport; repositories translate rows.

- **Why:** avoids the fat-controller and smart-repository anti-patterns; keeps
  each layer testable on its own.
- **Violation signals:** a route handler with loops over external calls,
  aggregation logic or multi-table writes; a repository method that calls
  another service or an external API; business decisions inside a query.

### A6 Contracts first

A contract shared across a boundary (request/response schemas, event payloads,
types shared between packages or between backend and frontend) has a single
source of truth. Change it there first, then the consumers; the same schema
drives request validation and response serialization. Extend with new fields or
new versions; do not casually change required fields — the change fans out
across producers, consumers and tests.

- **Violation signals:** a duplicated type that drifted from its schema; a
  hand-copied contract updated on one side only; a required field added without
  updating every consumer in the same change.

### A7 A thin module is a decision, not laziness

Not every feature needs every layer. Skipping the service or repository layer
is allowed only for a pure read/proxy with no orchestration and no persistence
of its own, and the choice is recorded (plan, conventions file or a comment at
the module entry). The moment the module writes to storage or coordinates more
than one call, it earns the full split.

- **Violation signals:** a routes-only module that now writes to the DB or
  calls two external systems; a new thin module with no recorded reason.

---

## 3. Module tiers

All tiers are legitimate; what matters is that a module never *leaks* across a
boundary, not that it fills every layer.

| Tier | Files (typical) | Use when |
| --- | --- | --- |
| **Full split** | routes + service + repository (+ per-aggregate query files) + pure helpers + constants | orchestration and persistence |
| **Facade** | routes + service (facade over a hidden pipeline) + repository + a public interface type | internals complex enough to hide behind one interface |
| **Mid-tier** | routes + service + repository + helpers | ordinary CRUD with some coordination |
| **Thin** | routes only (± pure helpers) | pure read/proxy (A7), recorded |

The composition root (app bootstrap + module registration) is the **only**
place that knows the whole graph. Everything else stays ignorant of the whole.

---

## 4. Frontend rules

### F1 One-way imports

Draw the import arrow and never let it point backwards: **routes/pages →
features → shared UI → lib**. Shared code never imports from features; features
do not import each other's internals (go through shared code, or lift the
shared piece up). Enforce with a lint rule (for example
`import/no-restricted-paths` or eslint-plugin-boundaries) when the project has
one, so the boundary is real, not aspirational.

### F2 Thin routes / pages

Route files (`page`, `layout`, route modules, router entries) compose UI from
features. They do not hold business logic, data transformation, or reusable
components. In file-system routers, the routing folder and the product
architecture are different things: routing folders route; features hold the
product.

### F3 No business logic in UI components

Custom hooks are the modern home for reusable stateful/business logic; pure
functions hold calculations; the component renders. Split for a **reason to
change**, not to hit a line count — the "and" test: if you describe a component
with "…and…" ("shows the profile *and* fetches the orders *and* formats the
invoice"), each "and" is a candidate to extract. Prefer composition (children,
slots, compound components) over a dozen configuration props. The strict
container/presentational split is historical; use hooks instead of wrapper
"container" components.

### F4 Data fetching at the edge

Network access goes through a dedicated API layer (one client instance; each
request = types + schema + fetcher + query hook) and the project's data library
(for example TanStack Query, SWR, RTK Query), or — in RSC frameworks — Server
Components and a server-only data-access layer. Never an ad-hoc `fetch` inside
a component when the project has a data layer. Server cache stays in the data
library; it is not copied into `useState`.

### F5 Colocate; promote on the second use

Put code as close as possible to where it is used: a component's test, styles,
sub-components and one-off helpers live next to it. A component, hook, util or
constant starts inside the feature that needs it and moves to shared only when a
second feature genuinely needs it. Prefer a little duplication over the wrong
abstraction. Avoid a generic `utils/` junk drawer; prefer purpose-named modules
in lib (`lib/datetime`, `lib/currency`) with their own tests.

### F6 Feature public API

A feature exposes one public entry (an `index` file or equivalent) that defines
its surface; other features and routes import only from it. Avoid deep or broad
barrels created only for prettier import paths — they defeat tree-shaking and
slow builds; prefer direct imports in performance-sensitive code.

### F7 State placement

Separate **server cache** (fetched data) from **UI state** (`isOpen`, selected
tab). Colocate state in the narrowest component that needs it, lift only when
two need it, reach for Context or a global store only when prop-drilling
actually hurts. Shape state well: group related fields, one status enum instead
of contradictory booleans, derive instead of duplicating, store IDs not nested
copies.

### F8 Server / client boundary (RSC frameworks)

Server Components by default; add the client directive only at interactive
leaves, because everything a client file imports enters the client bundle.
Pass server-rendered content into client components via `children`/props.
Guard server-only modules (DB, secrets, business logic) with a server-only
marker. Sensitive reads go through a server-only **data-access layer** that
runs auth checks and returns minimal DTOs — layouts are not a security
boundary. Every server action is a public endpoint: authenticate, authorize the
specific object, validate input server-side, and keep actions in their own
files.

### F9 One typed config

Read env/config once in a single typed module, coerce to real types with
defaults, and validate at startup so a bad config fails immediately. Never
scatter `process.env` (or `import.meta.env`) reads through components or
services.

---

## 5. Frontend reference layouts

Generic shapes to map a project onto (or to propose when a project has none).
They are not mandates; the project's documented layout wins.

**Feature-based SPA (bulletproof-react style)**

```
src/
  app/            routes, providers, router — composes features
  features/<name>/{components,hooks,api,types,utils}/ + index.ts (public API)
  components/     shared UI; components/ui/ for design-system primitives
  lib/            API client, query client, purpose-named helpers
  config/         typed, validated config
  testing/        test utilities, mock server handlers
```

**Next.js App Router**

```
app/              routing only: thin page/layout/route files
  (group)/        route groups organize without changing URLs
  **/_components/ private folders for route-local components
src/features/     product code per feature
src/components/   shared UI
src/lib/          server-only data-access layer, actions, schemas, helpers
```

Deeper guidance with citations:
[`frontend-react.md`](frontend-react.md),
[`frontend-nextjs-app-router.md`](frontend-nextjs-app-router.md).

---

## 6. What is *not* a violation

- Importing **type-only** shared contracts or domain types from any layer.
- The composition root importing everything — that is its job.
- Infrastructure importing inner layers — it implements the ports.
- A test importing across layers to build fixtures.
- A documented, recorded thin module (A7) or a known deviation listed in the
  layer map, as long as the change does not extend it.
- Duplication between two features before a second real consumer exists (F5).
