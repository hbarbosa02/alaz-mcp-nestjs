# Alaz MCP Server

MCP Server (alaz-nestjs-mcp v1.3.0) that exposes the **live context** of any NestJS project to AI agents (Cursor, Claude Desktop, GitHub Copilot).

## What it does

Transforms documentation, conventions, module structure and git history into queryable context via the Model Context Protocol (MCP).

- **Stack detection**: Reads `package.json` to detect ORM (MikroORM, TypeORM, Objection), validation (nestjs-zod, class-validator), test framework (Jest, Vitest), Redis, BullMQ — prompts and resources adapt automatically.
- **Dynamic changelog**: Generates changelog from Git history, versioned by tags (Keep a Changelog format). Falls back to static docs when repository is unavailable.

## Installation

```bash
npm install
```

## Configuration

The project root path is **required** and must come from the MCP configuration (mcp.json), not from `.env`. Use `${workspaceFolder}` for the current workspace.

Create a `.env` file for the server (optional):

```env
PORT=3100
NODE_ENV=development
```

## Usage

### HTTP mode (primary)

```bash
npm run start:dev
```

The MCP is available at `http://localhost:3100/mcp`. The client must send the `X-Project-Root` header with the project path.

### STDIO mode (lightweight, no server)

```bash
npm run start:stdio
```

Requires `PROJECT_ROOT` in the MCP config (see below). Useful when the target project environment is not running (Docker, database, etc.).

## Docker

### HTTP mode

Build and run the server in HTTP mode (port 3100):

```bash
docker compose up --build
```

The MCP is available at `http://localhost:3100/mcp`. Stop with `Ctrl+C` or `docker compose down`.

### STDIO mode

Run the server in STDIO mode via Docker. Requires the project path to analyze:

```bash
docker compose run --rm -e PROJECT_ROOT=/workspace -v /path/to/your/project:/workspace:ro app-stdio
```

Replace `/path/to/your/project` with the absolute path to the NestJS project you want to analyze. For Cursor, use `${workspaceFolder}` in mcp.json (see [docs/MCP-SETUP.md](docs/MCP-SETUP.md)).

## Cursor configuration

Add to your project's or Cursor's `.cursor/mcp.json`:

**HTTP** (requires `X-Project-Root` header):
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

**STDIO** (recommended for workspace-based projects):
```json
{
  "mcpServers": {
    "alaz-nestjs-stdio": {
      "command": "npx",
      "args": ["ts-node", "-r", "tsconfig-paths/register", "src/mcp/feature/mcp-stdio.entry.ts"],
      "cwd": "/path/to/alaz-mcp-nestjs",
      "env": {
        "PROJECT_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

Tools accept an optional `projectRoot` parameter to override the config per request.

## Available Tools

| Tool | Description |
|------|-------------|
| `list-modules` | Lists all modules |
| `get-module-detail` | Module details |
| `get-entity-schema` | Entity schema (MikroORM, TypeORM, Objection) |
| `list-endpoints` | Lists API endpoints |
| `check-conventions` | Validates project conventions |
| `get-recent-changes` | Recent commits |
| `get-test-summary` | Test summary |
| `get-create-module-guide` | Step-by-step guide to create a module (Cursor-compatible) |
| `get-create-endpoint-guide` | Step-by-step guide to add an endpoint (Cursor-compatible) |
| `get-update-docs-guide` | Guide to update module documentation (Cursor-compatible) |
| `get-code-review-checklist` | Code review checklist (Cursor-compatible) |
| `get-investigate-bug-guide` | Guide to investigate a bug (Cursor-compatible) |

## Resources

- `alaz://onboarding` — Recommended entry point
- `alaz://architecture` — Architecture overview
- `alaz://conventions/api`, `/testing`, `/cqrs` — Conventions
- `alaz://authentication` — Auth and RBAC
- `alaz://changelog` — Changelog (Git-based, versioned by tags; fallback to CHANGELOG.md or docs/changes/*.md)
- `alaz://modules/{name}` — Module docs
- `alaz://modules/{name}/endpoints` — Module endpoints
- `alaz://entities/{name}` — Entity schema

## Documentation

- [docs/MCP-SERVER.md](docs/MCP-SERVER.md) — Technical details, tools, resources, prompts, Docker
- [docs/MCP-SETUP.md](docs/MCP-SETUP.md) — Step-by-step setup (Cursor, Claude Desktop, Copilot), Docker, and example prompts
