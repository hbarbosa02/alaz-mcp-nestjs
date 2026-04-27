# Codebase Concerns

**Analysis date:** 2026-04-27

**Project state (decisions, todos, deferred work):** [`.specs/project/STATE.md`](../project/STATE.md) — **AD-001**–**AD-007**, **Active blockers** (none as of last update), and **Deferred ideas** (full Angular / Laravel adapters).

## Decision implementation status

Quick map of architecture decisions from **STATE** and whether the codebase reflects them. Full rationale lives in [`.specs/project/STATE.md`](../project/STATE.md).

| Code | Topic | Status |
| ---- | ----- | ------ |
| **AD-001** | Optional `PROJECT_ROOT` in env schema (no machine default); HTTP uses `X-Project-Root` + ALS | Done |
| **AD-002** | MCP server `serverInfo` version from `package.json` via `MCP_SERVER_VERSION` | Done |
| **AD-003** | Angular / Laravel via ports + registry; real adapters | Partial — modules wired, detection tests expanded; **adapters still deferred** (see *Deferred ideas* in STATE) |
| **AD-004** | Framework detection cache — LRU (max 10), key = raw project root string; tests for hits / eviction | Done |
| **AD-005** | GitHub Actions CI (`lint`, `format:check`, `test`, `test:e2e`, `build`) | Done |
| **AD-006** | Single canonical `mcp.json` / transport matrix in **`docs/MCP-SETUP.md`**; README short; DRY across docs | Done (documentation policy; no runtime change) |
| **AD-007** | `ProjectRootContextService`: ALS first, then `ConfigService` `PROJECT_ROOT`; STDIO validates after Nest config load | Done |

**Legend:** **Done** = implemented as described in STATE. **Partial** = structure in place; listed remainder still open.

## Tech debt

**Resolved (AD-001, Done):** `PROJECT_ROOT` is optional in `env.schema.ts` (no machine-specific default; avoids silently pointing at the wrong tree on other machines). HTTP analysis is rooted by `X-Project-Root` (middleware + ALS), not that env value; STDIO entrypoints require `PROJECT_ROOT` in the process environment. See `test/unit/util/feature/schemas/env.spec.ts`.

**Resolved (AD-002, Done):** MCP server version is a single source of truth from `package.json` via `MCP_SERVER_VERSION` in `src/mcp/core/mcp-server-package.ts`, used in `mcp.module.ts` and `mcp-stdio.module.ts`. See `test/unit/core/mcp-server-package.spec.ts`.

**Partially addressed (AD-003, Partial) — open remainder tracked as deferred**

- **Done in repo:** `AngularDomainModule` and `LaravelDomainModule` are **imported** in `McpNestjsModule` and `McpStdioModule`; JSDoc on domain modules and `FrameworkAdapterRegistryService` documents port-based extension. `framework-detector.service.spec.ts` covers precedence, `devDependencies`, and Laravel `require-dev`.
- **Issue (deferred in STATE):** Full **port implementations** for Angular and Laravel are not shipped; **adapters** are still missing, so users still get “coming soon” via `FrameworkAdapterRegistryService` for those frameworks.
- **Files:** `src/mcp/domain/angular/`, `src/mcp/domain/laravel/`, `framework-adapter-registry.service.ts`
- **Impact:** Same user-facing gap until real adapters are registered. Do not claim full Angular / Laravel support in product copy until adapter-level tests cover those surfaces (per AD-003).
- **Next (matches STATE *Deferred ideas*):** Implement adapter services, register them in `FrameworkAdapterRegistryService`, and add tests before marketing support.

**Policy (AD-006, Done) — operator documentation DRY:** Full `mcp.json` and transport matrix live in **`docs/MCP-SETUP.md`**. `README.md` is the landing; `docs/MCP-SERVER.md` links to setup for config. Avoid re-duplicating long JSON in multiple files without updating `STATE.md`.

**Documented in code and tests (AD-004, Done):** `FrameworkDetectorService` documents LRU (max 10) keying on the raw project root string; unit tests assert cache hits, separate keys for different strings, and re-detection after eviction. See `src/mcp/core/data-access/services/framework-detector.service.ts` and `test/unit/core/data-access/services/framework-detector.service.spec.ts`.

**Resolved (AD-007, Done):** `ProjectRootContextService.getProjectRoot()` uses AsyncLocalStorage first, then validated `ConfigService` `PROJECT_ROOT` (not raw `process.env` only). STDIO entry validates root after `createApplicationContext`, then `enterWith`. See `src/mcp/core/data-access/services/project-root-context.service.ts`, `mcp-stdio.entry.ts`, `test/unit/core/data-access/services/project-root-context.service.spec.ts`.

## Security considerations

**HTTP deployment without application-level auth**

- **Risk:** If `nest start` is exposed on a network, any client that can reach `/mcp` can supply `X-Project-Root` and request paths that the server’s OS user can read.
- **Files:** `project-root.middleware.ts` (validates header presence, not *authorization* to read paths)
- **Current mitigation:** Documentation positions localhost and trusted networks; no auth in product scope today.
- **Recommendations:** Run behind a reverse proxy with auth, bind to `127.0.0.1`, or use STDIO; document threat model in `docs/` if exposing beyond dev.

**Path resolution / symlink / traversal**

- **Risk:** Misconfiguration could theoretically expose unintended directories depending on `PathResolverService` and call sites.
- **Files:** `src/mcp/core/data-access/services/path-resolver.service.ts` (review when changing)
- **Recommendations:** Add tests for `..` segments and symlinks; reject roots outside an allowlist for hosted deployments if product evolves that way.

## Known bugs

*None recorded with reproduction steps in this pass.* Track new items here when filed.

## Fragile areas

**Project root context (ALS + env fallback)**

- **Why:** STDIO and HTTP differ; `getProjectRoot` must work when MCP library callbacks lose ALS. **AD-001** removed a machine-specific default from the env schema; **AD-007** implements resolution order (ALS → validated `ConfigService` `PROJECT_ROOT`) and STDIO bootstrap after Nest config load. HTTP remains `X-Project-Root` + per-request `run()`.
- **Residual risk:** New code that bypasses `ProjectRootContextService` or assumes HTTP has a process-wide default root should still be reviewed.
- **Files:** `src/mcp/core/data-access/services/project-root-context.service.ts`, `mcp-stdio.entry.ts`, middleware
- **Common failures:** Missing header (HTTP 400 with clear JSON); empty `PROJECT_ROOT` in STDIO.
- **Safe modification:** Add tests in `project-root-context.service.spec.ts` and e2E when changing bootstrap order.
- **Test coverage:** Unit + E2E exist for HTTP and STDIO patterns.

**Framework detection cache**

- **Why:** LRU-style eviction (max 10 keys) is tied to *resolved* project root string; multiple equivalent paths could cache separately.
- **Files:** `framework-detector.service.ts`
- **Test coverage:** `framework-detector.service.spec.ts`

## Test / ops gaps

**Resolved (AD-005, Done):** GitHub Actions workflow `.github/workflows/ci.yml` runs on push/PR to `main`/`master`: `lint`, `format:check`, `test`, `test:e2e`, `build` (Node 22, `npm ci`).

**Coverage excludes ports and placeholder domains**

- **Evidence:** `collectCoverageFrom` in `jest.config.js` negates `core/ports` and `domain/angular` / `laravel` trees.
- **Impact:** Type-only or adapter surfaces may lack direct coverage; acceptable if integration tests cover call paths, but new port methods should be tested at adapter level.

## Dependency / scaling

- **MCP and Nest:** Pin ranges in `package.json` as today; run `npm audit` periodically for published server images.
- **Scaling:** Long-running HTTP server is single-process; heavy parallel client load not profiled in this pass; for many tenants prefer separate processes or per-project workers if product matures.
