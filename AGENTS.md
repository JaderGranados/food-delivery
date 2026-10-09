# AGENTS.md

Guidance for AI coding agents working in this repository.

## Overview

Food-delivery platform backend: a single **NestJS 12** application (no monorepo) using **Yarn 1 (classic)**, ESM (`"type": "module"`), strict TypeScript with NodeNext module resolution. Tooling is the Nest 12 defaults: **vitest** (not Jest) and **oxlint** (not ESLint), plus **Prettier** and **dependency-cruiser** for architecture rules.

## Commands

```bash
yarn install
yarn start:dev        # run the API in watch mode
yarn build
yarn lint             # oxlint + architecture rules (lint:arch)
yarn lint:arch        # dependency-cruiser only (.dependency-cruiser.cjs)
yarn test             # vitest unit tests (*.spec.ts next to the code in src/)
yarn test:e2e         # vitest e2e (test/*.e2e-spec.ts, vitest.config.e2e.ts)
yarn format           # prettier --write .
yarn format:check

yarn test src/app.controller.spec.ts   # single test file
yarn test -t "should return"           # tests matching a name
```

Yarn 1 does not auto-install peer dependencies — add missing peers explicitly (e.g. `vite` is a direct devDependency for vitest).

## Architecture

Hexagonal architecture organized in vertical slices, one slice per bounded context:

```
src/modules/<context>/{domain,application,infrastructure}/index.ts
src/shared/{domain,application,infrastructure}/index.ts      # shared kernel (create when needed)
```

Bounded contexts (`src/modules/`):

| Context           | Owns                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `ordering` (core) | Cart, checkout, order lifecycle, price snapshot at order time        |
| `catalog`         | Restaurants, opening hours, menus, items, prices, availability       |
| `delivery` (core) | Couriers, availability/location, dispatch, delivery tracking         |
| `payments`        | Authorization, capture, refunds, payouts to restaurants and couriers |
| `promotions`      | Campaigns, coupons, eligibility, discount calculation                |
| `ratings`         | Reviews of restaurants and couriers, aggregate scores                |
| `customers`       | Customer account, profile, saved addresses                           |

Each context keeps its own model of shared concepts (e.g. Delivery has a delivery job referencing an order id, not Ordering's `Order` class).

The import boundaries are enforced by `yarn lint:arch`; the detailed rules live in `.claude/rules/`:

- `.claude/rules/hexagonal-layers.md` — layer direction and framework-free domain
- `.claude/rules/bounded-contexts.md` — how contexts may depend on each other
- `.claude/rules/index-imports.md` — importing through `index.ts`
