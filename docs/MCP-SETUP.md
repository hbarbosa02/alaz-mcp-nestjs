# Alaz MCP Server — Setup Guide

Step-by-step guide to configure the Alaz MCP Server with Cursor, Claude Desktop, and GitHub Copilot. All transports (HTTP, SSE, STDIO) are validated by E2E tests.

## Prerequisites

- Node.js 18+
- Target NestJS project to analyze (or use the current workspace)

## 1. Install and run the server

```bash
cd /path/to/alaz-mcp-nestjs
npm install
```

### Option A: HTTP mode (Streamable HTTP + SSE)

```bash
npm run start:dev
```

The server runs at `http://localhost:3100`. Endpoints:

- `/mcp` — Streamable HTTP (primary)
- `/sse` — Server-Sent Events

### Option B: STDIO mode (lightweight, no server)

No server process needed. The MCP client spawns the process on demand. Use when the target project has no database or Redis running.

---

## 2. Cursor configuration

Create or edit `.cursor/mcp.json` in your project root or in Cursor's config directory.

### Step 2.1: Choose transport

| Transport | When to use |
|-----------|-------------|
| **HTTP** | Server running (`npm run start:dev`), full API |
| **SSE** | Same as HTTP; some clients prefer SSE |
| **STDIO** | No server; spawns process per session |

### Step 2.2: HTTP configuration

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

**Important:** Replace `http://localhost:3100` if the server runs on another host/port. `${workspaceFolder}` is the path to the project you want to analyze (usually the current workspace).

### Step 2.3: SSE configuration

```json
{
  "mcpServers": {
    "alaz-nestjs-sse": {
      "url": "http://localhost:3100/sse",
      "headers": {
        "X-Project-Root": "${workspaceFolder}"
      }
    }
  }
}
```

### Step 2.4: STDIO configuration

```json
{
  "mcpServers": {
    "alaz-nestjs-stdio": {
      "command": "npx",
      "args": [
        "ts-node",
        "-r",
        "tsconfig-paths/register",
        "src/mcp/feature/mcp-stdio.entry.ts"
      ],
      "cwd": "/path/to/alaz-mcp-nestjs",
      "env": {
        "PROJECT_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

**Replace** `/path/to/alaz-mcp-nestjs` with the absolute path to the Alaz MCP project (e.g. `/home/user/projects/alaz-mcp-nestjs`).

### Step 2.5: Restart Cursor

After editing `mcp.json`, restart Cursor or reload the window so the MCP server is picked up.

---

## 3. Claude Desktop configuration

Edit Claude Desktop's MCP config (location varies by OS):

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

### HTTP

```json
{
  "mcpServers": {
    "alaz-nestjs": {
      "url": "http://localhost:3100/mcp",
      "headers": {
        "X-Project-Root": "/path/to/your/nestjs-project"
      }
    }
  }
}
```

### STDIO

```json
{
  "mcpServers": {
    "alaz-nestjs-stdio": {
      "command": "npx",
      "args": [
        "ts-node",
        "-r",
        "tsconfig-paths/register",
        "src/mcp/feature/mcp-stdio.entry.ts"
      ],
      "cwd": "/path/to/alaz-mcp-nestjs",
      "env": {
        "PROJECT_ROOT": "/path/to/your/nestjs-project"
      }
    }
  }
}
```

Restart Claude Desktop after changes.

---

## 4. GitHub Copilot configuration

GitHub Copilot uses MCP via the Copilot Chat extension. Configure MCP in VS Code/Cursor settings or in `.vscode/mcp.json`:

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

Ensure the Alaz server is running (`npm run start:dev`) before using Copilot with this MCP.

---

## 5. Example prompts

Use these prompts in Cursor, Claude, or Copilot to request information directly from the MCP.

### Onboarding and overview

- *"Read the alaz://onboarding resource and summarize the project structure."*
- *"What does the alaz://architecture resource say about the API overview?"*
- *"Show me the project conventions from alaz://conventions/api."*

### Modules and structure

- *"Use the list-modules tool to list all modules in this project."*
- *"Get the full details of the user module with get-module-detail."*
- *"Read alaz://modules/user to understand the user module structure."*

### Entities and schema

- *"Use get-entity-schema to show the User entity schema."*
- *"Read alaz://entities/Tenant for the Tenant entity."*

### Endpoints and API

- *"List all endpoints with list-endpoints."*
- *"Show endpoints for the account module with list-endpoints moduleName=account."*
- *"Read alaz://modules/user/endpoints for the user module endpoints."*

### Conventions and quality

- *"Run check-conventions for the user module."*
- *"What are the testing conventions? Read alaz://conventions/testing."*
- *"Show the CQRS conventions from alaz://conventions/cqrs."*

### Recent changes and changelog

- *"Use get-recent-changes to show commits from the last 7 days."*
- *"Read alaz://changelog for the project changelog."*

### Tests

- *"Use get-test-summary to show the test coverage summary."*
- *"Get test summary for the user module."*

### Prompts (executable steps)

- *"Use the create-module prompt with moduleName=billing, hasController=true, hasEntity=true."*
- *"Get the create-endpoint prompt for moduleName=user, httpMethod=POST, description=Create user."*
- *"Run the update-documentation prompt for moduleName=account."*
- *"Use code-review-checklist with moduleName=user."*
- *"Run investigate-bug with moduleName=user, bugDescription=Login fails with 500."*

---

## 6. Transport validation

All transports are covered by E2E tests (`npm run test:e2e`):

| Transport | Test file | Validated |
|-----------|-----------|-----------|
| Streamable HTTP | `test/e2e/http/mcp-http.e2e-spec.ts` | Connection, tools/list, resources/list, prompts/list, all 7 tools |
| SSE | `test/e2e/sse/mcp-sse.e2e-spec.ts` | Endpoint availability, X-Project-Root requirement |
| STDIO | `test/e2e/stdio/mcp-stdio.e2e-spec.ts` | Initialize, tools/list, all 7 tools/call |

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Project root is required" | Ensure `X-Project-Root` (HTTP/SSE) or `PROJECT_ROOT` (STDIO) is set in mcp.json |
| Connection refused | Start the server with `npm run start:dev` for HTTP/SSE |
| STDIO not found | Use absolute path for `cwd` in mcp.json |
| Framework not supported | Target project must be NestJS (package.json with @nestjs/core) |
| invalid_union when reading alaz:// URIs (e.g. alaz://onboarding) | Fixed: resources now return the proper MCP `ReadResourceResult` format (`{ contents: [{ uri, mimeType, text }] }`). Ensure you use the latest server version. |
