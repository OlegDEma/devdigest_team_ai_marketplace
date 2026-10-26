# Sources — why each rule holds, and the reading list

The rules in `../SKILL.md` are not invented; they are the standard Onion /
Hexagonal / Clean-architecture consensus for backends and the current React /
Next.js community consensus for frontend organization. This file maps each rule
to the sources that argue it best, then lists every link.

## Rule → source

| Rule | Principle | Source |
| --- | --- | --- |
| A1 Direction | The dependency rule: coupling always toward the center; the domain compiles and runs without the outer layers. "Stuff inside doesn't know about stuff outside." | Palermo's Onion articles; NDepend "Going Beyond Layers"; Seemann "it's all the same"; Allegro Tech; Bazaglia. |
| A2 Persistence confinement | Repository pattern: an abstraction over storage that decouples data access from business logic and enables dependency inversion. | LogRocket "Repository pattern with TypeScript"; Code Maze. |
| A3 External I/O through ports | Ports are interfaces in the inner ring; adapters are outer-ring implementations; "app may import ports but not adapters". Dependency inversion does not need a DI-container library. | Cockburn's Ports and Adapters, via Hasan "Two Real Codebases"; Grudzynskyi "Unfolding infrastructure"; Wolk Software (SOLID + Onion, container-based contrast). |
| A4 Validation at the edge | Input is validated and translated at the boundary before it reaches the core; the core trusts its types. | Hexagonal guides (Chakray); Zod "validate at boundaries" guidance. |
| A5 Orchestration in the application layer | Application services coordinate use cases; they are neither the domain nor the transport. Avoid anemic-domain and fat-controller anti-patterns. | Allegro Tech (anti-patterns); Scharhag "layers → onions → hexagons". |
| A6 Contracts first | One schema as the single source of truth across a boundary, driving both validation and serialization. | Zod docs; schema-first API design. |
| A7 Thin modules are a decision | Layering serves the code; do not add ceremony a pure proxy does not need, but do not let a real feature skip it. | Scharhag; pragmatic reading of the above. |
| F1 One-way imports | Unidirectional imports shared → features → app, enforced by lint. | bulletproof-react project structure; Feature-Sliced Design layers. |
| F2 Thin routes | Route files compose from product code; `app/` is for routing only. | Next.js project-structure docs; FSD Next.js guide. |
| F3 Logic out of UI | Custom hooks are the home for reusable logic; container/presentational is historical. | react.dev "Reusing Logic with Custom Hooks"; Dan Abramov's 2019 note. |
| F4 Data at the edge | A dedicated API layer; server state in query hooks, not local state. | bulletproof-react api-layer; TkDodo. |
| F5 Colocate, promote on second use | Colocation; AHA programming. | Kent C. Dodds "Colocation", "AHA Programming"; Robin Wieruch. |
| F6 Feature public API | One public index per feature; broad barrels hurt builds. | bulletproof-react; Vercel "optimized package imports". |
| F7 State placement | Server cache vs UI state; colocate state; shape state well. | Kent C. Dodds; react.dev "Choosing the State Structure". |
| F8 Server-client boundary | Server Components by default; DAL with DTOs; server actions are public endpoints. | Next.js data-security and server-actions docs; Markbåge. |
| F9 One typed config | Read env once, typed and validated. | Echobind "Ditch process.env". |

## Reading list — backend layering

**Bold** = cited directly in the rules; the rest is background and contrast.

### Canonical / the layer model

- **[Layers, Onions, Ports, Adapters: it's all the same — Mark Seemann (ploeh)](https://blog.ploeh.dk/2013/12/03/layers-onions-ports-adapters-its-all-the-same/)** — the key insight that Onion = Hexagonal = Clean.
- **[Onion Architecture — blog.allegro.tech](https://blog.allegro.tech/2023/02/onion-architecture.html)** — the most concrete statement of the dependency rule and the anti-patterns.
- [Onion Architecture: Going Beyond Layers — NDepend](https://blog.ndepend.com/onion-architecture-layers/)
- [From layers to onions and hexagons — Michael Scharhag](https://www.mscharhag.com/architecture/layer-onion-hexagonal-architecture)
- [Onion Architecture in ASP.NET Core — Code Maze](https://code-maze.com/onion-architecture-in-aspnetcore/) — layer responsibilities, framework-agnostic.

### Node.js / TypeScript (applies equally to functional, container-free wiring)

- **[Ports and Adapters, Explained with Two Real Codebases — Md Nasimul Hasan](https://saadh393.github.io/blog/adapter-port-architecture-two-cases)** — "app/ may import ports but not adapters".
- **[Unfolding infrastructure in the Onion architecture — Dani Grudzynskyi](https://dgrudzynskyi.github.io/dev-blog/architecture/2020/12/18/unfolding-infrastructure-in-onion-architecture.html)**
- [Clean architecture with TypeScript: DDD, Onion — André Bazaglia](https://bazaglia.com/clean-architecture-with-typescript-ddd-onion/)
- [Onion Architecture in Node.js with TypeScript — Sankhadip Samanta](https://sankhadip.medium.com/onion-architecture-in-node-js-with-typescript-5508612a4391)
- [Hexagonal Architecture: a complete guide — Chakray](https://chakray.com/hexagonal-architecture-a-complete-guide-to-robust-and-testable-software-design/)
- [Exploring the Repository pattern with TypeScript and Node — LogRocket](https://dev.to/logrocket/exploring-the-repository-pattern-with-typescript-and-node-4jc9) — behind A2.

### Contrast — DI-container style (optional, not required by these rules)

Read for the layering ideas; the boundaries are the same whether or not a DI-container library does the wiring.

- [Implementing SOLID and the Onion Architecture in Node.js with InversifyJS — Wolk Software](http://blog.wolksoftware.com/implementing-solid-and-the-onion-architecture-in-node-js-with-typescript-and-inversifyjs)
- [Same, on dev.to — remojansen](https://dev.to/remojansen/implementing-the-onion-architecture-in-nodejs-with-typescript-and-inversifyjs-10ad)

### Enforcement tooling

- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) — import-boundary rules for JS/TS.
- [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries) — architectural boundaries as lint rules.
- [import-linter](https://github.com/seddonym/import-linter) — layer contracts for Python.
- [ArchUnit](https://www.archunit.org/) — architecture rules as tests for the JVM.

## Reading list — frontend organization

Each source was verified to resolve when the guidance was written unless marked
(Medium and npm often return HTTP 403 to automated fetchers; their content was
confirmed via search). **CURRENT** = reflects current best practice;
**HISTORICAL** = kept for context, not recommended as-is.

### React — folder & project structure
- React FAQ "File Structure" (HISTORICAL page / CURRENT stance) — https://legacy.reactjs.org/docs/faq-structure.html
- Robin Wieruch — React Folder Structure [2026] — https://www.robinwieruch.de/react-folder-structure/
- Josh Comeau — Delightful React File/Directory Structure — https://www.joshwcomeau.com/react/file-structure/
- Web Dev Simplified — How To Structure React Projects — https://blog.webdevsimplified.com/2022-07/react-folder-structure/
- A Folder Per Type or Per Feature (AI-era take) — https://dev.to/avery_code/a-folder-per-type-or-a-folder-per-feature-only-one-of-them-survives-an-ai-session-c67

### React — reference architectures
- bulletproof-react (repo) — https://github.com/alan2207/bulletproof-react
- bulletproof-react — project-structure.md — https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md
- bulletproof-react — project-standards.md — https://github.com/alan2207/bulletproof-react/blob/master/docs/project-standards.md
- bulletproof-react — api-layer.md — https://github.com/alan2207/bulletproof-react/blob/master/docs/api-layer.md
- Feature-Sliced Design — home — https://feature-sliced.design/
- FSD — Overview — https://feature-sliced.design/docs/get-started/overview
- FSD — Layers reference — https://feature-sliced.design/docs/reference/layers
- Redux Style Guide — feature folders / single-file slice — https://redux.js.org/style-guide/#structure-files-as-feature-folders-with-single-file-logic
- Ducks (original, HISTORICAL origin) — https://github.com/erikras/ducks-modular-redux

### React — splitting & designing components
- react.dev — Thinking in React — https://react.dev/learn/thinking-in-react
- react.dev — Your First Component — https://react.dev/learn/your-first-component
- react.dev — Importing and Exporting Components — https://react.dev/learn/importing-and-exporting-components
- react.dev — Passing Props to a Component — https://react.dev/learn/passing-props-to-a-component
- react.dev — Keeping Components Pure — https://react.dev/learn/keeping-components-pure
- react.dev — Choosing the State Structure — https://react.dev/learn/choosing-the-state-structure
- Composition vs Inheritance (legacy page, CURRENT stance) — https://legacy.reactjs.org/docs/composition-vs-inheritance.html
- SRP in React (cekrem, 2025) — https://cekrem.github.io/posts/single-responsibility-principle-in-react/
- SRP in React (Sunscrapers) — https://sunscrapers.com/blog/single-responsibility-principle-in-react-applications-part-1/

### React — component patterns
- patterns.dev — Compound — https://www.patterns.dev/react/compound-pattern/
- patterns.dev — Provider — https://www.patterns.dev/vanilla/provider-pattern/
- patterns.dev — HOC — https://www.patterns.dev/react/hoc-pattern/
- patterns.dev — Render Props — https://www.patterns.dev/react/render-props-pattern/
- patterns.dev — Hooks — https://www.patterns.dev/react/hooks-pattern/
- Martin Fowler — Headless Component — https://www.martinfowler.com/articles/headless-component.html
- Brad Frost — Atomic Design (post) — https://bradfrost.com/blog/post/atomic-web-design/
- Brad Frost — Atomic Design (book) — https://atomicdesign.bradfrost.com/

### React — component API & prop naming
- Imply — An Opinionated Guide to Component APIs — https://imply.io/blog/an-opinionated-guide-to-component-apis/
- Naming Props and States in React — https://medium.com/@shivamsainier98/best-practices-for-naming-props-and-states-in-react-db0d91a09feb (may return 403 to automated fetchers)

### React — where business logic lives (custom hooks)
- react.dev — Reusing Logic with Custom Hooks — https://react.dev/learn/reusing-logic-with-custom-hooks
- react.dev — You Might Not Need an Effect — https://react.dev/learn/you-might-not-need-an-effect
- react.dev — Separating Events from Effects — https://react.dev/learn/separating-events-from-effects
- Felix Gerschau — Separation of concerns with hooks — https://felixgerschau.com/react-hooks-separation-of-concerns/
- eMoosavi — Decoupling Business Logic from UI with Custom Hooks — https://www.emoosavi.com/blog/decoupling-business-logic-from-ui-with-custom-react-hooks
- The Controller Pattern — https://medium.com/@MBuchalik/the-controller-pattern-separate-business-logic-from-presentation-in-react-331f72fcb32a (may return 403 to automated fetchers)
- Presentational and Container Components (HISTORICAL, withdrawn 2019) — https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0 (may return 403 to automated fetchers)

### React — state management organization
- Kent C. Dodds — Application State Management with React — https://kentcdodds.com/blog/application-state-management-with-react
- Kent C. Dodds — State Colocation will make your app faster — https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster
- react.dev — Sharing State Between Components — https://react.dev/learn/sharing-state-between-components
- react.dev — Passing Data Deeply with Context — https://react.dev/learn/passing-data-deeply-with-context

### React — data / service / API layer
- bulletproof-react — api-layer.md — https://github.com/alan2207/bulletproof-react/blob/master/docs/api-layer.md
- TkDodo — Practical React Query — https://tkdodo.eu/blog/practical-react-query
- TkDodo — React Query as a State Manager — https://tkdodo.eu/blog/react-query-as-a-state-manager

### React — constants, utils/helpers, config
- Tips to Use Constants File in TypeScript — https://dev.to/amirfakour/tips-to-use-constants-file-in-typescript-27je
- Why utils & helpers is a dump — https://dev.to/sergeysova/why-utils-helpers-is-a-dump-45fo
- Echobind — Ditch process.env, use a typed config — https://echobind.com/post/ditch-process-env-use-a-typed-config

### React — error handling
- react.dev — Error boundary reference — https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- react-error-boundary (repo) — https://github.com/bvaughn/react-error-boundary
- react-error-boundary (npm) — https://www.npmjs.com/package/react-error-boundary

### React — barrels, colocation principles, style guides
- Vercel — How we optimized package imports in Next.js — https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
- Barrel files are wrecking your bundle — https://dev.to/adioof/barrel-files-are-the-clean-code-habit-quietly-wrecking-your-bundle-1cn6
- Kent C. Dodds — Colocation — https://kentcdodds.com/blog/colocation
- Kent C. Dodds — AHA Programming — https://kentcdodds.com/blog/aha-programming
- Kent C. Dodds — Prop Drilling — https://kentcdodds.com/blog/prop-drilling
- Airbnb React/JSX Style Guide (partly dated) — https://github.com/airbnb/javascript/tree/master/react

### Next.js App Router — project & folder structure
- Next.js — Project structure and organization — https://nextjs.org/docs/app/getting-started/project-structure
  - Colocation — https://nextjs.org/docs/app/getting-started/project-structure#colocation
  - Private folders — https://nextjs.org/docs/app/getting-started/project-structure#private-folders
  - Route groups — https://nextjs.org/docs/app/getting-started/project-structure#route-groups
  - `src` folder — https://nextjs.org/docs/app/getting-started/project-structure#src-folder
  - Organizing strategies — https://nextjs.org/docs/app/getting-started/project-structure#organizing-your-project
  - Split by feature/route — https://nextjs.org/docs/app/getting-started/project-structure#split-project-files-by-feature-or-route
- Next.js — Layouts and Pages — https://nextjs.org/docs/app/getting-started/layouts-and-pages
- Next.js — Route Groups (convention) — https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
- Next.js — Dynamic Routes (convention) — https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes
- Next.js — `src` Folder — https://nextjs.org/docs/app/api-reference/file-conventions/src-folder
- Next.js — Route Handlers (`route.js`) — https://nextjs.org/docs/app/api-reference/file-conventions/route
- Next.js — `proxy.js` (was `middleware.ts` pre-v16) — https://nextjs.org/docs/app/api-reference/file-conventions/proxy
  - Migration to proxy — https://nextjs.org/docs/app/api-reference/file-conventions/proxy#migration-to-proxy

### Next.js App Router — feature-based structure
- FSD — The Ultimate Next.js App Router Architecture — https://feature-sliced.design/blog/nextjs-app-router-guide
- FSD — Usage with Next.js — https://feature-sliced.design/docs/guides/tech/with-nextjs
- Best Practices for Organizing Next.js 15 (2025) — https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji
- Next.js Folder Structure: Best Practices 2026 (Groovy Web) — https://www.groovyweb.co/blog/nextjs-project-structure-full-stack
- Next.js Folder Structure Guide for App Router (Buttercups) — https://www.buttercups.tech/blog/react/nextjs-folder-structure-guide-for-app-router-projects
- Inside the App Router (2025 Edition) — https://medium.com/better-dev-nextjs-react/inside-the-app-router-best-practices-for-next-js-file-and-directory-structure-2025-edition-ed6bc14a8da3 (may return 403 to automated fetchers)

### Next.js App Router — server-client boundary
- Next.js — Server and Client Components — https://nextjs.org/docs/app/getting-started/server-and-client-components
  - Interleaving — https://nextjs.org/docs/app/getting-started/server-and-client-components#interleaving-server-and-client-components
- Next.js — The Server and Client Boundary — https://nextjs.org/docs/app/guides/server-and-client-boundary
- Composition Patterns (v14, HISTORICAL) — https://nextjs.org/docs/14/app/building-your-application/rendering/composition-patterns
- react.dev — Server Components — https://react.dev/reference/rsc/server-components
- react.dev — Server Functions — https://react.dev/reference/rsc/server-functions
- react.dev — `use client` — https://react.dev/reference/rsc/use-client
- react.dev — `use server` — https://react.dev/reference/rsc/use-server
- `server-only` (npm) — https://www.npmjs.com/package/server-only (may return 403 to automated fetchers)
- `client-only` (npm) — https://www.npmjs.com/package/client-only
- Dan Abramov — React for Two Computers — https://overreacted.io/react-for-two-computers/
- Daniel Saewitz — The Mental Model of Server Components — https://saewitz.com/the-mental-model-of-server-components

### Next.js App Router — data fetching, DAL, Server Actions
- Next.js — Fetching Data — https://nextjs.org/docs/app/getting-started/fetching-data
  - Reusing data with React.cache — https://nextjs.org/docs/app/getting-started/fetching-data#reusing-data-with-reactcache
- Next.js — Server Actions and Mutations — https://nextjs.org/docs/app/guides/server-actions
- Next.js — How to think about data security (DAL/DTO) — https://nextjs.org/docs/app/guides/data-security
  - Data Access Layer — https://nextjs.org/docs/app/guides/data-security#data-access-layer
- Next.js — Authentication (DAL, DTO, where checks go) — https://nextjs.org/docs/app/guides/authentication
  - Creating a Data Access Layer — https://nextjs.org/docs/app/guides/authentication#creating-a-data-access-layer-dal
- Sebastian Markbåge — How to Think About Security in Next.js — https://nextjs.org/blog/security-nextjs-server-components-actions
- Robin Wieruch — Authorization in Next.js (API → Service → DAL) — https://www.robinwieruch.de/next-authorization/
- Arcjet — Are Next.js server actions a security risk? — https://arcjet.com/learn/nextjs-server-action-security
- Makerkit — Next.js Server Actions Security — https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions

---

## Key debates (the rules take a stance on each)

1. **Barrel files** — a single public-API index per feature is good; broad
   barrels for prettier paths hurt tree-shaking and builds → prefer direct
   imports, use `optimizePackageImports` for third-party packages.
2. **Container/Presentational** — HISTORICAL; use custom hooks for logic.
3. **Atomic Design as folder law** — vocabulary yes for shared primitives; not a
   whole-app folder mandate → feature-based wins for product code.
4. **Type-based vs feature-based** — feature-based with a public index boundary
   beyond trivial size.
5. **DI container vs hand-rolled inversion** — both satisfy A3; the boundary is
   the import, not the decorator.
