# Project Structure

**Root:** `alaz-mcp-nestjs` (repository root)

## Directory tree (trimmed to ~3 levels)

```text
.
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   └── mcp/
│       ├── core/           # cross-cutting MCP infrastructure
│       ├── domain/         # nestjs | shared | angular | laravel
│       ├── feature/        # mcp module, stdio app, entries
│       └── util/           # env, parser, events
├── test/
│   ├── unit/               # mirrors src (core, domain, util, feature)
│   ├── e2e/
│   │   ├── fixtures/sample-project/   # analyzed project for e2e
│   │   ├── setup/                     # mcp client expectations, env
│   │   └── transports/                # http, sse, stdio
│   └── helpers/
├── docs/                   # MCP-SERVER, CHANGELOG, setup, architecture
├── docker / compose files (as present in repo)
└── [config] eslint, jest, nest-cli, tsconfig, etc.
```

## Module organization (src/mcp)

### `mcp/core`

**Purpose:** Ports, file/git/path services, project root, framework detection, middleware used by all transports.  
**Key files:** `mcp-core.module.ts`, `core/ports/`, `core/data-access/services/*.service.ts`, `core/feature/middleware/project-root.middleware.ts`

### `mcp/domain/nestjs`

**Purpose:** NestJS-specific MCP tools, resources, prompts, and adapters implementing core ports.  
**Key files:** `nestjs.domain.module.ts`, `domain/nestjs/feature/tools/`, `.../resources/`, `.../prompts/`, `.../data-access/services/`, `.../data-access/strategies/`

### `mcp/domain/shared`

**Purpose:** Tools/resources that are registered as shared in MCP but import `McpCoreModule` + `NestjsDomainModule` (e.g. recent changes + changelog).  
**Key files:** `shared.domain.module.ts`, `recent-changes.tool.ts`, `changelog.resource.ts`

### `mcp/domain/angular` / `mcp/domain/laravel`

**Purpose:** Placeholder modules for future support; no providers yet.

### `mcp/feature`

**Purpose:** Wire Nest modules for HTTP (`mcp.module.ts`) vs STDIO (`mcp-stdio.module.ts`, `stdio-app.module.ts`, `mcp-stdio.entry.ts`).

### `mcp/util`

**Purpose:** `env` Zod schema, `require-adapter` style helpers, parser utilities, confirmation prompt event helper.

## Where things live

| Capability            | Location |
| --------------------- | -------- |
| Bootstrap HTTP        | `src/main.ts` → `AppModule` |
| Bootstrap STDIO       | `src/mcp/feature/mcp-stdio.entry.ts` → `McpStdioAppModule` |
| MCP transport config  | `src/mcp/feature/mcp.module.ts` (`McpModule.forRoot`, middleware routes) |
| Analyzed project I/O  | `FileReaderService`, `PathResolverService`, `GitContextService` under `mcp/core/data-access` |
| E2E sample Nest app   | `test/e2e/fixtures/sample-project/` |

## Special directories

| Directory        | Role |
| ---------------- | ---- |
| `.specs/`        | TLC Spec-Driven project + codebase docs (this tree) |
| `docs/`          | Operator and developer documentation for the MCP product |
| `test/e2e/setup` | Shared expectations (tool names, resource URIs, headers) for transport tests |
