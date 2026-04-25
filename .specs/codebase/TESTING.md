# Testing Infrastructure

## Test frameworks

- **Unit / integration:** Jest 29 with `ts-jest`; test environment `node`
- **E2E:** Same Jest via `jest-e2e.config.js` (only `*.e2e-spec.ts`, `testTimeout: 30000`, `setupFiles: test/e2e/setup/env.setup.js`)
- **Coverage:** Jest `collectCoverageFrom` on `src/**/*.ts` with explicit exclusions (entrypoints, `index.ts` barrels, `core/ports`, Angular/Laravel placeholders); thresholds in `jest.config.js` (statements/lines/functions 80%, branches 72%)

## Test organization

- **Unit:** `test/unit/**` mirrors `src/**` — `core/`, `domain/nestjs/`, `domain/shared/`, `util/`, `feature/`
- **E2E:** `test/e2e/transports/{http,sse,stdio}/*.e2e-spec.ts`
- **Naming:** `*.spec.ts` (unit), `*.e2e-spec.ts` (E2E)
- **Fixtures:** `test/e2e/fixtures/sample-project` — minimal Nest project used as `X-Project-Root` / analysis target
- **Helpers:** `test/helpers/` (e.g. `mock-data.ts`); E2E expectations centralized in `test/e2e/setup/mcp-client.setup.ts`

## Patterns

### Unit

- **Approach:** Nest `Test.createTestingModule` or direct construction where appropriate; mocks for git/file I/O in core tests (see `git-context.service.spec.ts` patterns)
- **Location:** `test/unit/...` adjacent structure to `src/`
- **ESLint:** `**/*.spec.ts` ignored in `eslint.config.mjs` (line 10)

### E2E (HTTP / SSE / STDIO)

- **HTTP:** In-process `INestApplication` with `@nestjs/testing`, dynamic port (`listen(0)` pattern), `fetch` to `/mcp` with `X-Project-Root` + MCP SDK `Client` in some tests (`mcp-http.e2e-spec.ts` imports from `@modelcontextprotocol/sdk`)
- **Approach:** Validates tool list, static resources, resource templates, prompts, and transport-specific behavior
- **STDIO:** Separate `mcp-stdio.e2e-spec.ts` (stdio transport; process-level `PROJECT_ROOT`)

## Test execution

| Command         | Role |
| --------------- | ---- |
| `npm test`      | Jest default — unit `*.spec.ts` only (`testRegex` in `jest.config.js`) |
| `npm run test:e2e` | E2E config |
| `npm run test:cov` | Unit + coverage report |
| `npm run precommit` | Lint + `format:check` + unit tests (default local gate before commit) |
| `npm run build` + `npm run lint` | Build and lint (no tests) |

**Configuration files:** `jest.config.js` (root), `jest-e2e.config.js` (extends and overrides regex)

## Coverage targets

- **Enforced:** Global thresholds in `jest.config.js` (see `coverageThreshold`)
- **Exclusions:** Non-testable or generated surfaces (e.g. ports, placeholder domains) per `collectCoverageFrom` negation patterns

## Test coverage matrix

| Code layer            | Test type  | Location pattern | Run command   |
| --------------------- | ---------- | ---------------- | ------------- |
| Core services         | Unit       | `test/unit/core/**` | `npm test` |
| Domain NestJS adapters| Unit       | `test/unit/domain/nestjs/**` | `npm test` |
| Domain shared         | Unit       | `test/unit/domain/shared/**` | `npm test` |
| MCP middleware        | Unit       | `test/unit/core/feature/middleware/**` | `npm test` |
| Transport + MCP I/O  | E2E        | `test/e2e/transports/**` | `npm run test:e2e` |
| App wiring            | Unit       | `test/unit/feature/*.module.spec.ts` | `npm test` |
| Placeholder domains   | Excluded   | (no `*.spec` for angular/laravel; excluded from coverage) | — |

## Parallelism assessment

| Test type | Parallel-safe? | Isolation | Evidence |
| --------- | -------------- | --------- | -------- |
| Unit      | Yes (typical)  | Jest workers; tests use fresh mocks/instances in `beforeEach` | Widespread `*.spec.ts` without shared global mutable state in sampled files |
| E2E HTTP  | Likely         | In-memory app; fixture path is read-only; dynamic ports reduce collision | `mcp-http.e2e-spec.ts` uses per-run server port |
| E2E STDIO | Caution        | May bind global process / stdin; run as separate files/processes in Jest | Separate file; avoid assuming parallel with other STDIO suites without checking `jest` config for `maxWorkers` |

*If E2E flakes appear when `jest` runs with high parallelism, start by running `npm run test:e2e -- --runInBand` to isolate ordering/port issues.*

## Gate check commands

| Gate  | When to use | Command |
| ----- | ------------ | ------- |
| Quick | After small unit-only change | `npm test` (and `npm run lint` if TS/API surface touched) |
| Full  | After transport, middleware, or cross-module MCP change | `npm test` && `npm run test:e2e` |
| Release | Pre-tag / pre-publish | `npm run build` && `npm run lint` && `npm test` && `npm run test:e2e` |

*CI:* **`.github/workflows/ci.yml`** runs on push/PR to `main`/`master`: `lint`, `format:check`, `test`, `test:e2e`, `build` (Node 22, `npm ci`) — see **AD-005** in `.specs/project/STATE.md`. Local work still uses `npm run precommit` or full commands as above.
