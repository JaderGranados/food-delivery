---
paths:
  - 'src/**/*.ts'
---

# Bounded contexts

Contexts live in `src/modules/<context>/`: `ordering`, `catalog`, `delivery`, `payments`, `promotions`, `ratings`, `customers`.

- A context may use another context **only** through its public application API: `src/modules/<other>/application/index.ts`. Never import another context's `domain` or `infrastructure`.
- Don't share entities across contexts. If Delivery needs order data, it gets it from Ordering's application layer (or an event) and maps it into its own model.
- `src/shared/` is a shared kernel for truly generic building blocks (base `Entity`, `Money`, `Result`, …). It follows the same layer rules and must never import from `src/modules/`.
- New contexts go in `src/modules/<context>/` with all three layers, each with an `index.ts`. Their Nest module lives in `infrastructure/` and is imported by `src/app.module.ts` through `infrastructure/index.ts`.

Enforced rules: `slice-only-via-application-index`, `shared-not-to-modules`.
