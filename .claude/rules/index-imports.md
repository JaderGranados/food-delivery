---
paths:
  - 'src/**/*.ts'
---

# Import through `index.ts`

Each layer folder (`domain`, `application`, `infrastructure`) exposes its public API through its `index.ts`.

- Any import that crosses into a **different** layer folder must target that folder's `index.ts`. This applies to other layers of the same context, other contexts, `src/shared/`, and files outside the layers (`app.module.ts`, `main.ts`).
- The project is NodeNext ESM: write the explicit `.js` path. Bare directory imports don't resolve.

  ```ts
  import { Order } from '../domain/index.js'; // ✅
  import { Order } from '../domain'; // ❌ not valid in NodeNext
  import { Order } from '../domain/order.js'; // ❌ bypasses index.ts
  ```

- Path aliases (`tsconfig.json` `paths`): `@shared/*` → `src/shared/*`, `@modules/*` → `src/modules/*`.
  - Use an alias when importing **outside your own context**: from `src/shared/`, from another context, or from files outside `src/modules/` (e.g. `app.module.ts`). The index rules still apply.

    ```ts
    import type { UseCase } from '@shared/application/index.js'; // ✅
    import { SignUpCustomer } from '@modules/customers/application/index.js'; // ✅ from another context
    ```

  - Use relative paths **within the same context** (`'../domain/index.js'`, `'../../ports/index.js'`).

- **Inside** a layer folder, import files directly or through a sub-folder's `index.ts` (`./customer.js`, `../ports/index.js`, `./http/index.js`). Sub-folders (`ports/`, `use-cases/`, `http/`, `persistence/`, …) each have an `index.ts`. The layer's root `index.ts` re-exports only what other layers need (e.g. `infrastructure/index.ts` exports just the Nest module). Never import the layer's own root `index.ts` from inside the layer, because it creates cycles.
- When you add something another layer needs, export it from that layer's `index.ts`.
- `*.spec.ts` and `*.e2e-spec.ts` are exempt and may import internals.

Enforced rules: `layer-import-via-index`, `outside-import-via-index`, `no-own-index-import`, `no-circular`.
