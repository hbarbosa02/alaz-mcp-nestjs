# Alaz MCP Server

**alaz-nestjs-mcp** (v1.3.0) is an [MCP](https://modelcontextprotocol.io/) server that exposes a **target NestJS project’s** live context to AI clients (Cursor, Claude Desktop, GitHub Copilot): modules, entities, routes, conventions, docs, and Git history as **tools**, **resources**, and **prompts**.

## What it does

The client supplies the project root (`X-Project-Root` in HTTP/SSE, or `PROJECT_ROOT` in STDIO). The server reads that tree and answers with stack-aware output (ORM, validation, tests, Redis, BullMQ, etc. from `package.json` and `composer.json` when present).

- **Stack** — Detects ORM (MikroORM, TypeORM, Objection), validation (Zod, class-validator), test runner (Jest, Vitest), optional Redis and BullMQ. Prompts and resources follow what the project uses.
- **Changelog** — From Git (Conventional Commits; grouped by last tag when tags exist). If Git is missing or unusable, falls back to `CHANGELOG.md` or `docs/changes/*.md` in the target project.

**Runtime:** Node.js 18+.

## Install

```bash
npm install
```

The **analyzed app** is not configured in this repo’s `.env`. Set the target path in the MCP client (`mcp.json`); in Cursor, use `${workspaceFolder}` for the workspace you want inspected.

Optional server `.env` (this process only):

```env
PORT=3100
NODE_ENV=development
```

## Run

### HTTP (default)

```bash
npm run start:dev
```

MCP base URL: `http://localhost:3100/mcp`. Clients must send `X-Project-Root` with the absolute path to the NestJS project.

### STDIO (no HTTP server)

```bash
npm run start:stdio
```

Set `PROJECT_ROOT` in `mcp.json` (see [docs/MCP-SETUP.md](docs/MCP-SETUP.md)). Use when you do not want a long-running server or the target app is not up.

## Docker

**HTTP** — From this repo:

```bash
docker compose up --build
```

Serves `http://localhost:3100/mcp`. Stop: `Ctrl+C` or `docker compose down`.

**STDIO** — Mount the project to analyze and set `PROJECT_ROOT`:

```bash
docker compose run --rm -e PROJECT_ROOT=/workspace -v /path/to/your/nestjs-app:/workspace:ro app-stdio
```

Use your real app path. Cursor: put `${workspaceFolder}` in `mcp.json` as in [docs/MCP-SETUP.md](docs/MCP-SETUP.md).

## Quick Cursor snip (HTTP)

Add to `.cursor/mcp.json` (project or user):

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

**STDIO** and **SSE** snippets, Docker-driven clients, and Claude/Copilot: [docs/MCP-SETUP.md](docs/MCP-SETUP.md).

Tools may take an optional `projectRoot` to override the header/env for a single call.

## Tools

| Tool | Description |
|------|-------------|
| `list-modules` | All modules (controllers, entities, tests) |
| `get-module-detail` | One module, full detail |
| `get-entity-schema` | Entity schema (MikroORM, TypeORM, Objection) |
| `list-endpoints` | HTTP routes (optional `moduleName` filter) |
| `check-conventions` | Convention check for a module |
| `get-recent-changes` | Recent commits (default window: 7 days) |
| `get-test-summary` | Test summary (optional module) |
| `get-create-module-guide` | Create-module steps (Cursor-friendly) |
| `get-create-endpoint-guide` | Add-endpoint steps (Cursor-friendly) |
| `get-update-docs-guide` | Update module docs (Cursor-friendly) |
| `get-code-review-checklist` | Review checklist (Cursor-friendly) |
| `get-investigate-bug-guide` | Bug-investigation steps (Cursor-friendly) |

## Resources

**Static**

- `alaz://onboarding` — Stack, modules, entry pointers
- `alaz://architecture` — Architecture / API overview
- `alaz://conventions/api`, `alaz://conventions/testing`, `alaz://conventions/cqrs` — Conventions
- `alaz://authentication` — Auth and RBAC
- `alaz://changelog` — Changelog (Git; else file fallback above)

**Templates** — Replace placeholders: `alaz://modules/{moduleName}`, `alaz://modules/{moduleName}/endpoints`, `alaz://entities/{entityName}`

## Prompts

Five prompts map to the `get-*-guide` / `get-code-review-checklist` tools for clients that only list tools. Details: [docs/MCP-SERVER.md](docs/MCP-SERVER.md).

## Project docs (this repository)

| Doc | Contents |
|-----|----------|
| [docs/MCP-SETUP.md](docs/MCP-SETUP.md) | Clients: HTTP / SSE / STDIO, Docker, `mcp.json`, troubleshooting |
| [docs/MCP-SERVER.md](docs/MCP-SERVER.md) | Transports, tools, resources, prompts, env, extending the server |
| [docs/MCP-FLOWS-AND-ARCHITECTURE.md](docs/MCP-FLOWS-AND-ARCHITECTURE.md) | Flows, Mermaid diagrams, `src/mcp` layout |
| [docs/MCP-FRAMEWORK-PORTS.md](docs/MCP-FRAMEWORK-PORTS.md) | Port interfaces, NestJS vs future frameworks |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | **This repo** release history (not the target app’s) |

## Development

```bash
npm test
npm run test:e2e
npm run precommit
```

`precommit` runs lint, Prettier check, and unit tests (see `.githooks` / `package.json`).
