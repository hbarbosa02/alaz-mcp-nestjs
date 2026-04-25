# State

**Last Updated:** 2026-04-25
**Current work:** None

---

## Recent decisions (last 60 days)

### AD-001: No machine-specific `PROJECT_ROOT` default in env schema (2026-04-25)

**Decision:** Remove the developer-specific default path from `env.schema.ts` (see `src/mcp/util/feature/schemas/env.schema.ts`). `PROJECT_ROOT` should be optional or unset by default, not a hard-coded home-directory path. Per-request project root for HTTP remains `X-Project-Root`; STDIO entrypoints continue to require `PROJECT_ROOT` in the process environment.

**Reason:** A non-portable default can silently point the server at the wrong tree on other machines; HTTP analysis is already rooted by the client header, not that default.

**Trade-off:** If any code path read `ConfigService`-backed `PROJECT_ROOT` for HTTP and assumed a default, that path must be audited after the schema change (likely none, since HTTP uses middleware + ALS).

**Impact:** Safer local setups and documentation; see `.specs/codebase/CONCERNS.md`.

**Status:** **Implemented** — `PROJECT_ROOT` is `z.string().optional()`; unit tests in `test/unit/util/feature/schemas/env.spec.ts`.

---

### AD-002: Report MCP server version from `package.json` (2026-04-25)

**Decision:** The version passed to `McpModule.forRoot` must match the published package version in `package.json` (single source of truth).

**Reason:** A literal `'1.0.0'` while the package is newer misleads clients that surface `serverInfo` and complicates support.

**Trade-off:** Small indirection via `src/mcp/core/mcp-server-package.ts` instead of inline strings.

**Impact:** `mcp.module.ts`, `mcp-stdio.module.ts`, and `MCP_SERVER_VERSION` export.

**Status:** **Implemented** — `MCP_SERVER_VERSION` from `package.json`; test in `test/unit/core/mcp-server-package.spec.ts`.

---

### AD-003: Angular / Laravel support via existing ports (2026-04-25)

**Decision:** Keep placeholder domains until full adapters ship; route new stacks only through core ports and `FrameworkAdapterRegistryService`. Add framework-specific detection tests before claiming support in product copy.

**Reason:** Half-implemented handlers are worse than clear “coming soon” messages; ports keep MCP surfaces stable.

**Trade-off:** Users on Angular/Laravel still see message-only paths until adapters exist.

**Impact:** `AngularDomainModule` / `LaravelDomainModule` **imported** in HTTP and STDIO MCP modules; JSDoc on domain modules and `FrameworkAdapterRegistryService`; expanded `framework-detector.service.spec.ts` (precedence, `devDependencies`, `require-dev`).

**Status:** **Partially implemented** — structure, wiring, and detection tests; **full port implementations still deferred** (see Deferred ideas).

---

## Active blockers

_(None.)_

---

## Lessons learned

_(None yet.)_

---

## Quick tasks completed

| #   | Description                         | Date       | Commit | Status  |
| --- | ----------------------------------- | ---------- | ------ | ------- |
| 001 | Initialize `.specs/project/` (TLC)  | 2026-04-25 | e35b801 | Done    |
| 002 | Brownfield map — 7 files in `.specs/codebase/` | 2026-04-25 | e35b801 | Done    |
| 003 | Implement AD-001, AD-002, AD-003 (code + tests) | 2026-04-25 | e35b801 | Done    |

---

## Deferred ideas

- [ ] Full Angular and Laravel **adapters** behind ports and registry routing (see **AD-003** remainder)

---

## Todos

- [x] Run **Map codebase** — done (see `.specs/codebase/`)
- [x] Record **AD-001**, **AD-002**, and **AD-003** in **Recent decisions**
- [x] Implement **AD-001** — env schema: remove non-portable `PROJECT_ROOT` default
- [x] Implement **AD-002** — `McpModule.forRoot` version from `package.json`
- [x] **AD-003** initial tranche — wire placeholder domain modules, document extension points, expand detection tests

---

## Preferences

_(Optional: e.g. preferred model notes for light vs heavy tasks — skill may suggest this once.)_
