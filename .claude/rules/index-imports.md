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

- **Inside** a layer folder, import sibling files directly (`./order.js`, `./value-objects/money.js`). Never import the folder's own `index.ts` — it creates cycles.
- When you add something another layer needs, export it from that layer's `index.ts`.
- `*.spec.ts` and `*.e2e-spec.ts` are exempt and may import internals.

Enforced rules: `layer-import-via-index`, `outside-import-via-index`, `no-own-index-import`, `no-circular`.
