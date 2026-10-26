# Example layer map — Node.js backend + React frontend

> **EXAMPLE ONLY.** This is a made-up project used to show what a filled layer
> map looks like and how the rules apply to it. Never assume a real project has
> these folders. Resolve the real map from the plan, the conventions file, a
> checker config, or the repository (SKILL.md, Step 1).

The example is a small "orders" product: a TypeScript HTTP API (any Node
framework: Fastify, Express, NestJS, Hono) with an SQL database through an ORM,
an email provider and a payment provider; and a React single-page app that
talks to the API.

```
api/
  src/
    domain/                 pure rules + types + port interfaces
      orders/pricing.ts
      orders/order.ts
      ports.ts              PaymentGateway, Mailer, Clock interfaces
    modules/
      orders/
        orders.routes.ts    presentation
        orders.service.ts   application
        orders.repository.ts data access
        orders.helpers.ts   pure row→DTO transforms
      health/
        health.routes.ts    thin module (A7: pure read, recorded)
    adapters/
      payments/stripe-gateway.ts   implements PaymentGateway
      mail/smtp-mailer.ts          implements Mailer
    db/
      schema.ts             ORM schema
      client.ts
    config.ts               typed, validated config (F9)
    app.ts                  composition root: builds the app, wires adapters
  contracts/                shared request/response schemas (A6 source of truth)
web/
  src/
    app/                    routes, providers, router
    features/
      checkout/{components,hooks,api,types}/ + index.ts
      order-history/{components,hooks,api,types}/ + index.ts
    components/ui/          shared design-system primitives
    lib/                    api client, query client, formatters
    config.ts
```

## The map

Source: *example* (in a real project: "CLAUDE.md § Architecture", the plan's
layer map, or "inferred, confirmed by the owner").

| Layer | Paths | May import | Must NOT import |
| --- | --- | --- | --- |
| Domain | `api/src/domain/**` | other domain code, `api/contracts/**` types | ORM, `api/src/db/**`, HTTP framework, `api/src/adapters/**`, `api/src/modules/**`, payment/mail SDKs, `config.ts` |
| Application | `api/src/modules/*/*.service.ts` | domain, `ports.ts`, its own repository, contracts | HTTP framework, adapters, SDKs, ORM |
| Data access | `api/src/modules/*/*.repository.ts` | ORM, `api/src/db/schema.ts`, domain types | HTTP framework, services, other modules' repositories |
| Infrastructure | `api/src/adapters/**`, `api/src/db/**`, `api/src/config.ts`, `api/src/app.ts` | anything inward | — |
| Presentation | `api/src/modules/*/*.routes.ts` | its service, `api/contracts/**` | ORM, `api/src/db/**`, SDKs, adapters |
| Routes (web) | `web/src/app/**` | features (via `index.ts`), shared UI, lib | — (keep thin) |
| Features (web) | `web/src/features/*/**` | shared UI, lib, own internals | other features' internals, `web/src/app/**` |
| Shared UI (web) | `web/src/components/**` | lib | features, app |
| Lib (web) | `web/src/lib/**`, `web/src/config.ts` | other lib modules | components, features, app |

- Composition root: `api/src/app.ts`.
- Persistence library: the ORM package + `api/src/db/schema.ts`.
- Boundary schemas: `api/contracts/**` (used by route schemas and by `web/src/features/*/api`).
- Mechanical enforcement: none yet (a plan could add a boundary checker).
- Known deviations: `health` is routes-only by decision (A7).

## How the rules play out here

**Creating an order (good):**

```
orders.routes.ts      validates body with the contract schema (A4), calls the service
  └─ orders.service.ts   resolves the customer, opens a transaction (A5)
       ├─ pricing.ts        domain: computes totals, pure (A1)
       ├─ orders.repository.ts  the only ORM import (A2)
       └─ PaymentGateway / Mailer  ports from ports.ts, wired in app.ts (A3)
```

**Violations a reviewer would report:**

| Code | Rule | Why |
| --- | --- | --- |
| `orders.routes.ts`: `import { db } from '../../db/client'` | A2 | persistence in presentation |
| `orders.service.ts`: `new Stripe(process.env.STRIPE_KEY)` | A3, F9 | SDK and env read in the application layer |
| `domain/orders/pricing.ts`: `import type { FastifyRequest } from 'fastify'` | A1 | domain names the HTTP framework |
| `features/checkout/components/CartSummary.tsx`: `useEffect(() => { fetch('/api/cart')… })` | F4 | network call in a component; belongs in `features/checkout/api` + a query hook |
| `components/ui/OrderBadge.tsx`: `import { useOrder } from '../../features/order-history/hooks/useOrder'` | F1 | shared UI importing a feature |
| `features/order-history/…`: `import { CartLine } from '../checkout/components/CartLine'` | F1, F6 | deep import into another feature; use `checkout/index.ts` or promote to shared (F5) |
| `app/orders/OrdersPage.tsx` computing totals and grouping orders inline | F2, F3 | logic in a route file; move to a hook or pure function in the feature |

**Fixes, in one line each:** move the query into `orders.repository.ts`; ask
for a `PaymentGateway` wired in `app.ts` with the key from `config.ts`; pass
plain values into `pricing.ts`; add `features/checkout/api/getCart.ts` + a
`useCart` query hook; pass the order as a prop to `OrderBadge`; import
`CartLine` through `checkout/index.ts` or promote it to `components/`; move the
grouping into `features/order-history/hooks/useGroupedOrders.ts`.
