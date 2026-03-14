# Alaz MCP Server

MCP Server that exposes the live context of any NestJS project to AI agents (Cursor, Claude Desktop, GitHub Copilot). Support for Angular and Laravel is planned.

**Transport validation:** HTTP, SSE, and STDIO are validated by E2E tests (`npm run test:e2e`). See [MCP-SETUP.md](./MCP-SETUP.md) for step-by-step configuration and example prompts.

## Architecture

The server dynamically reads the target project in real time. For detailed flows, diagrams, and file structure, see [MCP-FLOWS-AND-ARCHITECTURE.md](./MCP-FLOWS-AND-ARCHITECTURE.md).

- **Filesystem**: `src/`, `docs/`, `.cursor/rules/`
- **Git**: `git log`, `git diff`, `git tag` for recent changes and changelog generation
- **Static parsing**: MikroORM, TypeORM, Objection entities; controllers; decorators
- **package.json** and **composer.json**: Framework detection (NestJS, Angular, Laravel) and stack detection (ORM, validation, test framework, etc.)

### Framework detection

The server detects the project framework via `package.json` (NestJS, Angular) or `composer.json` (Laravel). NestJS-specific tools return a clear message when the project is not NestJS. See [MCP-FRAMEWORK-PORTS.md](./MCP-FRAMEWORK-PORTS.md) for interface contracts and future considerations.

## Transport modes

All transports are validated by E2E tests. For step-by-step setup (Cursor, Claude Desktop, Copilot) and example prompts, see [MCP-SETUP.md](./MCP-SETUP.md).

### Streamable HTTP (primary)

Runs on the `/mcp` route of the API. Requires `npm run start:dev`. The client must send the `X-Project-Root` header with the project path.

```bash
npm run start:dev
```

### SSE (Server-Sent Events)

Runs on the `/sse` route. Same server as HTTP. Requires `X-Project-Root` header.

### STDIO (lightweight mode)

Runs as a separate process. Does not require database or Redis. Requires `PROJECT_ROOT` in the MCP config.

```bash
npm run start:stdio
```

### Docker

| Mode | Command | Use case |
|------|---------|----------|
| **HTTP** | `docker compose up --build` | Server at `http://localhost:3100/mcp` |
| **STDIO** | `docker compose run --rm -e PROJECT_ROOT=/workspace -v /path/to/project:/workspace:ro app-stdio` | Spawned by MCP client; mount project to analyze |

See [MCP-SETUP.md](./MCP-SETUP.md) for mcp.json configuration with Docker.

### Quick config reference

**HTTP/SSE** — Add to mcp.json:
```json
{
  "mcpServers": {
    "alaz-nestjs": {
      "url": "http://localhost:3100/mcp",
      "headers": { "X-Project-Root": "${workspaceFolder}" }
    }
  }
}
```

**STDIO** — Add to mcp.json:
```json
{
  "mcpServers": {
    "alaz-nestjs-stdio": {
      "command": "npx",
      "args": ["ts-node", "-r", "tsconfig-paths/register", "src/mcp/feature/mcp-stdio.entry.ts"],
      "cwd": "/path/to/alaz-mcp-nestjs",
      "env": { "PROJECT_ROOT": "${workspaceFolder}" }
    }
  }
}
```

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `list-modules` | `projectRoot?` | Lists modules with controller, entities, tests |
| `get-module-detail` | `moduleName`, `projectRoot?` | Full module details |
| `get-entity-schema` | `entityName`, `orm?`, `projectRoot?` | Entity schema (MikroORM, TypeORM, Objection). ORM auto-detected if omitted |
| `list-endpoints` | `moduleName?`, `projectRoot?` | Lists endpoints (optional filter by module) |
| `check-conventions` | `moduleName`, `projectRoot?` | Validates project conventions |
| `get-recent-changes` | `days?`, `projectRoot?` | Recent commits (default 7 days) |
| `get-test-summary` | `moduleName?`, `projectRoot?` | Test summary |
| `get-create-module-guide` | `moduleName`, `hasController`, `hasEntity`, `projectRoot?` | Step-by-step guide to create a module (tool equivalent of `create-module` prompt) |
| `get-create-endpoint-guide` | `moduleName`, `httpMethod`, `description`, `projectRoot?` | Step-by-step guide to add an endpoint (tool equivalent of `create-endpoint` prompt) |
| `get-update-docs-guide` | `moduleName`, `projectRoot?` | Guide to update module documentation (tool equivalent of `update-documentation` prompt) |
| `get-code-review-checklist` | `moduleName`, `projectRoot?` | Code review checklist (tool equivalent of `code-review-checklist` prompt) |
| `get-investigate-bug-guide` | `moduleName`, `bugDescription`, `projectRoot?` | Guide to investigate a bug (tool equivalent of `investigate-bug` prompt) |

**Note:** The `get-*-guide` and `get-code-review-checklist` tools return the same content as the corresponding prompts. Use these tools when the MCP client (e.g. Cursor) does not support prompt invocation — only tools are callable via `call_mcp_tool`.

## Resources

### Static

| URI | Description |
|-----|-------------|
| `alaz://onboarding` | Aggregated onboarding guide |
| `alaz://architecture` | API Overview |
| `alaz://conventions/api` | API conventions |
| `alaz://conventions/testing` | Testing patterns |
| `alaz://conventions/cqrs` | CQRS and Jobs |
| `alaz://authentication` | Auth and RBAC |
| `alaz://changelog` | Changelog generated from Git (versioned by tags). Fallback to CHANGELOG.md or docs/changes/*.md when repository is not available |

### Templates (dynamic)

| URI Template | Description |
|--------------|-------------|
| `alaz://modules/{moduleName}` | Module docs and structure |
| `alaz://entities/{entityName}` | Entity schema |
| `alaz://modules/{moduleName}/endpoints` | Module endpoints |

## Prompts

| Prompt | Arguments | Description |
|--------|------------|-------------|
| `create-module` | `moduleName`, `hasController`, `hasEntity` | Template to create a module. Output includes executable steps — agent MUST ask developer for confirmation before executing. |
| `create-endpoint` | `moduleName`, `httpMethod`, `description` | Template for a new endpoint. Output includes executable steps — agent MUST ask developer for confirmation before executing. |
| `update-documentation` | `moduleName` | Guide to update docs. Output includes executable steps — agent MUST ask developer for confirmation before executing. |
| `code-review-checklist` | `moduleName` | Review checklist |
| `investigate-bug` | `moduleName`, `bugDescription` | Guide to investigate a bug. Output includes executable steps — agent MUST ask developer for confirmation before executing. |

**Cursor compatibility:** Cursor does not expose prompt invocation to the agent — only tools are callable. Use the corresponding `get-*-guide` / `get-code-review-checklist` tools instead (see Tools table above).

## Project root

The project root path is **required** and must come from the MCP configuration:

- **HTTP**: `headers["X-Project-Root"]` in mcp.json (e.g. `"${workspaceFolder}"`)
- **STDIO**: `env.PROJECT_ROOT` in mcp.json (e.g. `"${workspaceFolder}"`)

Tools accept an optional `projectRoot` parameter to override per request. If the path is not provided, the MCP returns an error.

## Environment variables (server)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default 3100) |
| `NODE_ENV` | No | development/staging/production |

## Adding new Tools/Resources/Prompts

1. Create the class in `src/mcp/domain/nestjs/feature/tools/`, `resources/` or `prompts/` (or `src/mcp/domain/shared/feature/` for shared capabilities)
2. Use the `@Tool`, `@Resource`, `@ResourceTemplate` or `@Prompt` decorators from `@rekog/mcp-nest`
3. Register in `NestjsDomainModule` or `SharedDomainModule` (imported by `McpNestjsModule` and `McpStdioModule`)
