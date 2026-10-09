---
paths:
  - 'src/**/*.ts'
---

# Hexagonal layers

Every context (`src/modules/<context>/`) and the shared kernel (`src/shared/`) has three layers. Dependencies point inward only:

```
infrastructure → application → domain
```

- **domain** — entities, value objects, domain services, domain events, repository ports (interfaces). Imports only its own files and other `domain` layers it's allowed to see (see `bounded-contexts.md`).
  - Must not import `application` or `infrastructure`.
  - Must be framework-free: no `@nestjs/*`, ORMs (typeorm, prisma, mongoose, mikro-orm, sequelize, drizzle, knex), DB/cache drivers (pg, mysql2, redis, ioredis), HTTP (express, fastify, axios). The enforced list is `FRAMEWORKS` in `.dependency-cruiser.cjs`.
- **application** — use cases, application services, application ports (e.g. `PaymentGateway`), DTOs. May import `domain`; must not import `infrastructure`. `@nestjs/common` (e.g. `@Injectable`) is allowed here.
- **infrastructure** — adapters: Nest module, controllers, repository implementations, external clients, mappers. May import `application` and `domain`.

Ports are defined in `domain`/`application` and implemented in `infrastructure`; bind them in the context's Nest module (in `infrastructure/`) with a provider token.

Enforced rules: `domain-not-to-outer-layers`, `application-not-to-infrastructure`, `domain-framework-free`.
