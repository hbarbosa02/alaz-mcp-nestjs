# Alaz MCP Server

MCP Server that exposes the **live context** of any NestJS project to AI agents (Cursor, Claude Desktop, GitHub Copilot).

## What it does

Transforms documentation, conventions, module structure and git history into queryable context via the Model Context Protocol (MCP).

- **Stack detection**: Reads `package.json` to detect ORM (MikroORM, TypeORM, Objection), validation (nestjs-zod, class-validator), test framework (Jest, Vitest), Redis, BullMQ — prompts and resources adapt automatically.
- **Dynamic changelog**: Generates changelog from Git history, versioned by tags (Keep a Changelog format). Falls back to static docs when repository is unavailable.

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PROJECT_ROOT=/path/to/your-nestjs-project
PORT=3100
NODE_ENV=development
```

`PROJECT_ROOT` must point to the target NestJS project root (with `src/`, `docs/`, etc.).

## Usage

### HTTP mode (primary)

```bash
npm run start:dev
```

The MCP is available at `http://localhost:3100/mcp`.

### STDIO mode (lightweight, no server)

```bash
PROJECT_ROOT=/path/to/your-nestjs-project npm run start:stdio
```

Useful when the target project environment is not running (Docker, database, etc.).

## Cursor configuration

Add to your project's or Cursor's `.cursor/mcp.json`:

**HTTP:**
```json
{
  "mcpServers": {
    "alaz-nestjs": {
      "url": "http://localhost:3100/mcp"
    }
  }
}
```

**STDIO:**
```json
{
  "mcpServers": {
    "alaz-nestjs-stdio": {
      "command": "npx",
      "args": ["ts-node", "src/mcp/feature/mcp-stdio.entry.ts"],
      "cwd": "/path/to/alaz-mcp-nestjs",
      "env": {
        "PROJECT_ROOT": "/path/to/your-nestjs-project"
      }
    }
  }
}
```

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

## Resources

- `alaz://onboarding` — Recommended entry point
- `alaz://architecture` — Architecture overview
- `alaz://conventions/api`, `/testing`, `/cqrs` — Conventions
- `alaz://authentication` — Auth and RBAC
- `alaz://changelog` — Changelog (Git-based, versioned by tags; fallback to static docs)
- `alaz://modules/{name}` — Module docs
- `alaz://entities/{name}` — Entity schema

## Documentation

See [docs/MCP-SERVER.md](docs/MCP-SERVER.md) for technical details.
