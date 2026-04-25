# Alaz MCP Server — Technical reference

NestJS-first MCP server: live project context (filesystem, Git, static analysis) for Cursor, Claude Desktop, and Copilot. Angular and Laravel adapters are **planned**; registry placeholders return a clear “coming soon” path until implemented. See [MCP-FRAMEWORK-PORTS.md](./MCP-FRAMEWORK-PORTS.md).

**E2E:** `npm run test:e2e` covers HTTP, SSE, and STDIO. **Client setup** (all transports, `mcp.json` examples): [MCP-SETUP.md](./MCP-SETUP.md). **Diagrams and package layout:** [MCP-FLOWS-AND-ARCHITECTURE.md](./MCP-FLOWS-AND-ARCHITECTURE.md).

## Architecture

The **target** project root is resolved per request: HTTP/SSE `X-Project-Root`, STDIO `PROJECT_ROOT`, or optional `projectRoot` on tools. There is no implicit default; missing config yields an error.

- **Tree:** `src/`, `docs/`, `.cursor/rules/`
- **Git:** `git log`, `git diff`, `git tag` (recent changes, changelog)
- **Parsing:** controllers, decorators, entities (MikroORM, TypeORM, Objection)
- **Manifests:** `package.json` and `composer.json` for framework and stack detection

### Framework detection

`package.json` (NestJS, Angular) and `composer.json` (Laravel) drive `FrameworkDetectorService`. Nest-only tools return an explicit message when the project is not NestJS. Adapters and contracts: [MCP-FRAMEWORK-PORTS.md](./MCP-FRAMEWORK-PORTS.md).

## Transports

| Mode | How | Project root |
|------|-----|----------------|
| Streamable HTTP | `/mcp` — `npm run start:dev` | Header `X-Project-Root` |
| SSE | `/sse` — same process as HTTP | Same header |
| STDIO | `npm run start:stdio` | `env.PROJECT_ROOT` in MCP config |

**Docker:** HTTP via `docker compose up --build`; STDIO via `docker compose run ... app-stdio` with a bind mount. See [MCP-SETUP.md](./MCP-SETUP.md#0-docker-optional).

**Config snippets** (HTTP, SSE, STDIO, including Docker-spawned clients) are maintained in [MCP-SETUP.md § Cursor configuration](./MCP-SETUP.md#2-cursor-configuration) to avoid drift from the README.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `list-modules` | `projectRoot?` | Modules with controller, entities, tests |
| `get-module-detail` | `moduleName`, `projectRoot?` | Full module detail |
| `get-entity-schema` | `entityName`, `orm?`, `projectRoot?` | Entity schema; ORM inferred if `orm` omitted |
| `list-endpoints` | `moduleName?`, `projectRoot?` | Routes; optional module filter |
| `check-conventions` | `moduleName`, `projectRoot?` | Convention validation |
| `get-recent-changes` | `days?`, `projectRoot?` | Commits (default 7 days) |
| `get-test-summary` | `moduleName?`, `projectRoot?` | Test summary |
| `get-create-module-guide` | `moduleName`, `hasController`, `hasEntity`, `projectRoot?` | Same as `create-module` prompt |
| `get-create-endpoint-guide` | `moduleName`, `httpMethod`, `description`, `projectRoot?` | Same as `create-endpoint` prompt |
| `get-update-docs-guide` | `moduleName`, `projectRoot?` | Same as `update-documentation` prompt |
| `get-code-review-checklist` | `moduleName`, `projectRoot?` | Same as `code-review-checklist` prompt |
| `get-investigate-bug-guide` | `moduleName`, `bugDescription`, `projectRoot?` | Same as `investigate-bug` prompt |

The `get-*-guide` and `get-investigate-bug-guide` / `get-code-review-checklist` tools exist because some hosts (e.g. Cursor) expose tools but not `prompts/get`. Content matches the named prompts.

## Resources

### Static

| URI | Role |
|-----|------|
| `alaz://onboarding` | Onboarding aggregate |
| `alaz://architecture` | API / architecture overview |
| `alaz://conventions/api` | API conventions |
| `alaz://conventions/testing` | Testing |
| `alaz://conventions/cqrs` | CQRS / jobs |
| `alaz://authentication` | Auth / RBAC |
| `alaz://changelog` | Git changelog (tag sections when tags exist); else files under target project |

### Templates

| URI pattern | Role |
|-------------|------|
| `alaz://modules/{moduleName}` | Module doc |
| `alaz://entities/{entityName}` | Entity schema |
| `alaz://modules/{moduleName}/endpoints` | Module routes |

## Prompts

| Prompt | Arguments | Notes |
|--------|-----------|--------|
| `create-module` | `moduleName`, `hasController`, `hasEntity` | Executable steps; agent should confirm with the developer before changing files |
| `create-endpoint` | `moduleName`, `httpMethod`, `description` | Same |
| `update-documentation` | `moduleName` | Same |
| `code-review-checklist` | `moduleName` | Checklist only |
| `investigate-bug` | `moduleName`, `bugDescription` | Executable steps; confirm first |

**Cursor:** use the matching `get-*` tool when prompts are not invocable.

## Project root (required)

- **HTTP/SSE:** `headers["X-Project-Root"]` in `mcp.json` (e.g. `"${workspaceFolder}"`).
- **STDIO:** `env.PROJECT_ROOT` in `mcp.json`.

Optional per-call override: `projectRoot` on tools.

## Server environment (this process)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3100` | HTTP port |
| `NODE_ENV` | — | e.g. `development` / `production` |

The analyzed app’s path is **not** a server env var.

## Adding tools, resources, or prompts

1. Implement under `src/mcp/domain/nestjs/feature/tools/`, `resources/`, or `prompts/`, or `src/mcp/domain/shared/feature/` if shared with STDIO (e.g. `get-recent-changes`).
2. Use `@Tool`, `@Resource`, `@ResourceTemplate`, or `@Prompt` from `@rekog/mcp-nest`.
3. Register in `NestjsDomainModule` or `SharedDomainModule` (pulled in by `McpNestjsModule` and `McpStdioModule` / `McpStdioAppModule`).
4. If you add user-visible surfaces, update E2E expectations in `test/e2e/setup/mcp-client.setup.ts` and the transport table in [MCP-SETUP.md § Transport validation](./MCP-SETUP.md#6-transport-validation).
