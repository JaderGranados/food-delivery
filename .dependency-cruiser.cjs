/**
 * Hexagonal architecture + vertical slices boundaries.
 *
 *   src/modules/<slice>/{domain,application,infrastructure}/index.ts
 *   src/shared/{domain,application,infrastructure}/index.ts
 *
 * Layer direction: infrastructure -> application -> domain (never outwards).
 * Every import that crosses a layer folder must target that folder's index.ts.
 */

// A layer folder: either a slice layer or a shared layer.
const LAYER =
  '^src/(modules/[^/]+|shared)/(domain|application|infrastructure)/';
const LAYER_INDEX =
  '^src/(modules/[^/]+|shared)/(domain|application|infrastructure)/index\\.ts$';

// Libraries the domain must stay independent from.
const FRAMEWORKS = [
  '@nestjs',
  'express',
  'fastify',
  'typeorm',
  '@prisma',
  'prisma',
  'mongoose',
  '@mikro-orm',
  'sequelize',
  'drizzle-orm',
  'knex',
  'pg',
  'mysql2',
  'redis',
  'ioredis',
  'axios',
];

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // --- Layer direction ---------------------------------------------------
    {
      name: 'domain-not-to-outer-layers',
      comment:
        'domain is the core: it cannot import application or infrastructure (of any slice or shared).',
      severity: 'error',
      from: { path: '^src/(modules/[^/]+|shared)/domain/' },
      to: { path: '^src/(modules/[^/]+|shared)/(application|infrastructure)/' },
    },
    {
      name: 'application-not-to-infrastructure',
      comment:
        'application depends on ports (interfaces), never on infrastructure adapters.',
      severity: 'error',
      from: { path: '^src/(modules/[^/]+|shared)/application/' },
      to: { path: '^src/(modules/[^/]+|shared)/infrastructure/' },
    },
    {
      name: 'domain-framework-free',
      comment: 'domain must not depend on frameworks, ORMs or I/O libraries.',
      severity: 'error',
      from: { path: '^src/(modules/[^/]+|shared)/domain/' },
      to: {
        dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer'],
        path: `node_modules/(${FRAMEWORKS.join('|')})/`,
      },
    },

    // --- Vertical slices ---------------------------------------------------
    {
      name: 'shared-not-to-modules',
      comment:
        'shared is a kernel used by slices; it cannot know about any slice.',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/modules/' },
    },
    {
      name: 'slice-only-via-application-index',
      comment:
        "A slice may only use another slice through that slice's application/index.ts.",
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/',
        pathNot: [
          '^src/modules/$1/',
          '^src/modules/[^/]+/application/index\\.ts$',
        ],
      },
    },

    // --- Public API (index.ts) ----------------------------------------------
    {
      name: 'layer-import-via-index',
      comment:
        "Imports into another layer folder must go through its index.ts (e.g. '../domain/index.js').",
      severity: 'error',
      from: {
        path: '(^src/(?:modules/[^/]+|shared)/(?:domain|application|infrastructure)/)',
      },
      to: { path: LAYER, pathNot: ['^$1', LAYER_INDEX] },
    },
    {
      name: 'outside-import-via-index',
      comment:
        'Code outside the layers (app.module.ts, main.ts, ...) must import layers through their index.ts.',
      severity: 'error',
      from: { path: '^src/', pathNot: LAYER },
      to: { path: LAYER, pathNot: LAYER_INDEX },
    },
    {
      name: 'no-own-index-import',
      comment:
        "Inside a layer folder, import sibling files directly, not the folder's own index.ts (avoids cycles).",
      severity: 'error',
      from: {
        path: '(^src/(?:modules/[^/]+|shared)/(?:domain|application|infrastructure)/)',
      },
      to: { path: '^$1index\\.ts$' },
    },

    // --- Hygiene -----------------------------------------------------------
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.(spec|e2e-spec)\\.ts$' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
  },
};
