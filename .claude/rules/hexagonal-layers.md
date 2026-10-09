---
paths:
  - 'src/**/*.ts'
---

# Hexagonal layers

Every context (`src/modules/<context>/`) and the shared kernel (`src/shared/`) has three layers. Dependencies point inward only:

```
infrastructure → application → domain
```

- **domain** — entities, value objects, domain services, domain events, domain errors. No ports. Imports only its own files and `src/shared/domain`.
  - Must not import `application` or `infrastructure`.
  - Must be framework-free: no `@nestjs/*`, ORMs (typeorm, prisma, mongoose, mikro-orm, sequelize, drizzle, knex), DB/cache drivers (pg, mysql2, redis, ioredis), HTTP (express, fastify, axios). The enforced list is `FRAMEWORKS` in `.dependency-cruiser.cjs`.
- **application** — use cases and the ports they need. May import `domain`; must not import `infrastructure`. `@nestjs/common` (e.g. `@Injectable`, `@Inject`) is allowed here.
  - `application/use-cases/<action>/` — one folder per use case (e.g. `use-cases/sign-up/`) containing `<name>.use-case.ts` (the class, implementing `UseCase<Command, Output>` from `src/shared/application`), `<name>.command.ts` (input), a file for the result type (e.g. `signed-up-customer.ts`), the `.spec.ts`, and an `index.ts`.
  - `application/ports/` — every port the application depends on: repositories (`customer.repository.ts`) and other services (`password-hasher.ts`). Ports are interfaces only.
  - `application/ports/tokens.ts` — one `Symbol` DI token per port (e.g. `CUSTOMER_REPOSITORY`, `PASSWORD_HASHER`).
- **infrastructure** — adapters: the context's Nest module, controllers and request DTOs (`http/`), repository implementations (`persistence/`), external clients, mappers. May import `application` and `domain`.

Use cases inject ports with `@Inject(TOKEN)`. The context's Nest module (in `infrastructure/`) binds each token to an adapter: `{ provide: TOKEN, useClass: Adapter }`.

Folders and files are kebab-case (`use-cases/`, `in-memory-customer.repository.ts`). Interfaces and types that are only used as types are imported with `import type`.

Enforced rules: `domain-not-to-outer-layers`, `application-not-to-infrastructure`, `domain-framework-free`.
