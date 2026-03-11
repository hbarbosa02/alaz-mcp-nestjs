# Alaz MCP Server

MCP Server that exposes the **live context** of the projeto-X NestJS project to AI agents (Cursor, Claude Desktop, GitHub Copilot).

## What it does

Transforms documentation, conventions, module structure and git history into queryable context via the Model Context Protocol (MCP).

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PROJECT_ROOT=/path/to/your-projeto-x-project
PORT=3100
NODE_ENV=development
```

`PROJECT_ROOT` must point to the projeto-X project root (with `src/`, `docs/`, etc.).

## Usage

### HTTP mode (primary)

```bash
npm run start:dev
```

The MCP is available at `http://localhost:3100/mcp`.

### STDIO mode (lightweight, no server)

```bash
PROJECT_ROOT=/path/to/projeto-x npm run start:stdio
```

Useful when the projeto-X environment is not running (Docker, database, etc.).

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
        "PROJECT_ROOT": "/path/to/projeto-x-nestjs"
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
| `get-entity-schema` | MikroORM entity schema |
| `list-endpoints` | Lists API endpoints |
| `check-conventions` | Validates projeto-X conventions |
| `get-recent-changes` | Recent commits |
| `get-test-summary` | Test summary |

## Resources

- `alaz://onboarding` — Recommended entry point
- `alaz://architecture` — Architecture overview
- `alaz://conventions/api`, `/testing`, `/cqrs` — Conventions
- `alaz://authentication` — Auth and RBAC
- `alaz://changelog` — Changelog
- `alaz://modules/{name}` — Module docs
- `alaz://entities/{name}` — Entity schema

## Documentation

See [docs/MCP-SERVER.md](docs/MCP-SERVER.md) for technical details.
