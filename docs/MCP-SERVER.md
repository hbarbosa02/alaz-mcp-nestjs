# Alaz MCP Server

MCP Server that exposes the live context of any NestJS project to AI agents (Cursor, Claude Desktop, etc.).

## Architecture

The server dynamically reads the target project in real time:

- **Filesystem**: `src/`, `docs/`, `.cursor/rules/`
- **Git**: `git log`, `git diff`, `git tag` for recent changes and changelog generation
- **Static parsing**: MikroORM, TypeORM, Objection entities; controllers; decorators
- **package.json**: Stack detection (ORM, validation library, test framework, Redis, BullMQ, NestJS version) — used to adapt prompts and resources to the project's tooling

## Transport modes

### Streamable HTTP (primary)

Runs on the `/mcp` route of the API. Requires `npm run start:dev`. The client must send the `X-Project-Root` header with the project path.

```bash
npm run start:dev
```

Cursor configuration (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "alaz-nestjs": {
      "url": "http://localhost:3100/mcp",
      "headers": {
        "X-Project-Root": "${workspaceFolder}"
      }
    }
  }
}
```

### STDIO (lightweight mode)

Runs as a separate process. Does not require database or Redis. Requires `PROJECT_ROOT` in the MCP config.

```bash
npm run start:stdio
```

Cursor configuration:

```json
{
  "mcpServers": {
    "alaz-nestjs-stdio": {
      "command": "npx",
      "args": ["ts-node", "src/mcp/feature/mcp-stdio.entry.ts"],
      "cwd": "/path/to/alaz-mcp-nestjs",
      "env": {
        "PROJECT_ROOT": "${workspaceFolder}"
      }
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
| `alaz://changelog` | Changelog generated from Git (versioned by tags). Fallback to static file in docs/changes/ when repository is not available |

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

1. Create the class in `src/mcp/feature/tools/`, `resources/` or `prompts/`
2. Use the `@Tool`, `@Resource`, `@ResourceTemplate` or `@Prompt` decorators
3. Register in `McpNestjsModule` and `McpStdioModule`
