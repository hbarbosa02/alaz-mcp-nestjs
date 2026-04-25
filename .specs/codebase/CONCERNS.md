# Codebase Concerns

**Analysis date:** 2026-04-25

## Tech debt

**Resolved (AD-001 / AD-002, 2026):** `PROJECT_ROOT` is optional in `env.schema.ts` (no machine-specific default). MCP server version comes from `MCP_SERVER_VERSION` in `src/mcp/core/mcp-server-package.ts` (re-exports `package.json` `version`) and is used in `mcp.module.ts` and `mcp-stdio.module.ts`.

**Placeholder framework domains (partial progress, AD-003)**

- **Issue:** Angular and Laravel **adapters** are not implemented; users still get “coming soon” via `FrameworkAdapterRegistryService` for those frameworks.
- **Files:** `src/mcp/domain/angular/`, `src/mcp/domain/laravel/`, `framework-adapter-registry.service.ts`
- **Status:** `AngularDomainModule` and `LaravelDomainModule` are **imported** in `McpNestjsModule` and `McpStdioModule`; JSDoc documents port-based extension. Detection tests were expanded (Nest vs Angular precedence, `devDependencies`, `require-dev` for Laravel).
- **Impact:** Same user-facing gap until real port implementations are registered.
- **Next:** Add adapter services in those domains and route them in `FrameworkAdapterRegistryService` when ready.

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

- **Why:** STDIO and HTTP differ; `getProjectRoot` must work when MCP library callbacks lose ALS.
- **Files:** `src/mcp/core/data-access/services/project-root-context.service.ts`, `mcp-stdio.entry.ts`, middleware
- **Common failures:** Missing header (HTTP 400 with clear JSON); empty `PROJECT_ROOT` in STDIO.
- **Safe modification:** Add tests in `project-root-context.service.spec.ts` and e2E when changing bootstrap order.
- **Test coverage:** Unit + E2E exist for HTTP and STDIO patterns.

**Framework detection cache**

- **Why:** LRU-style eviction (max 10 keys) is tied to *resolved* project root string; multiple equivalent paths could cache separately.
- **Files:** `framework-detector.service.ts`
- **Test coverage:** `framework-detector.service.spec.ts`

## Test / ops gaps

**No CI config in repository**

- **Evidence:** No `.github/workflows` or `.gitlab-ci.yml` found in the workspace at analysis time.
- **Impact:** Build/test discipline relies on local runs or off-repo automation.
- **Fix approach:** Add a minimal pipeline running `lint`, `test`, `test:e2e`, `build` on push/PR.

**Coverage excludes ports and placeholder domains**

- **Evidence:** `collectCoverageFrom` in `jest.config.js` negates `core/ports` and `domain/angular` / `laravel` trees.
- **Impact:** Type-only or adapter surfaces may lack direct coverage; acceptable if integration tests cover call paths, but new port methods should be tested at adapter level.

## Dependency / scaling

- **MCP and Nest:** Pin ranges in `package.json` as today; run `npm audit` periodically for published server images.
- **Scaling:** Long-running HTTP server is single-process; heavy parallel client load not profiled in this pass; for many tenants prefer separate processes or per-project workers if product matures.
