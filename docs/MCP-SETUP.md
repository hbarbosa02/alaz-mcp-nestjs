# Alaz MCP — Client setup

How to run the Alaz MCP server and register it in **Cursor**, **Claude Desktop**, and **GitHub Copilot**. Transports: Streamable HTTP (`/mcp`), SSE (`/sse`), STDIO. Coverage: `npm run test:e2e` (see [§ Transport validation](#6-transport-validation)).

## Prerequisites

- Node.js 18+
- Target NestJS project to analyze (or use the current workspace)

## 0. Docker (optional)

Run the server from a clone of this repo without a local `npm install` (images build from the Dockerfile).

### HTTP mode with Docker

```bash
cd /path/to/alaz-mcp-nestjs
docker compose up --build
```

MCP URL: `http://localhost:3100/mcp`. Use the same JSON as [§ HTTP configuration](#step-22-http-configuration).

### STDIO mode with Docker

Run the container with the project to analyze mounted:

```bash
cd /path/to/alaz-mcp-nestjs
docker compose run --rm -e PROJECT_ROOT=/workspace -v /path/to/your/nestjs-project:/workspace:ro app-stdio
```

For Cursor, configure mcp.json to spawn the Docker process:

```json
{
  "mcpServers": {
    "alaz-nestjs-stdio": {
      "command": "docker",
      "args": [
        "compose",
        "run",
        "--rm",
        "-e",
        "PROJECT_ROOT=/workspace",
        "-v",
        "${workspaceFolder}:/workspace:ro",
        "app-stdio"
      ],
      "cwd": "/path/to/alaz-mcp-nestjs"
    }
  }
}
```

Replace `/path/to/alaz-mcp-nestjs` with the absolute path to the Alaz MCP project.

---

## 1. Install and run the server

```bash
cd /path/to/alaz-mcp-nestjs
npm install
```

### Option A: HTTP mode (Streamable HTTP + SSE)

```bash
npm run start:dev
```

Listen address: `http://localhost:3100`. Routes:

- `/mcp` — Streamable HTTP (primary)
- `/sse` — Server-Sent Events

### Option B: STDIO mode (lightweight, no server)

The client spawns a process; no HTTP listener. Handy when you do not run this server beside the target app.

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

### Prompt-as-tool (Cursor — use when prompts are not available)

- *"Use get-create-module-guide with moduleName=billing, hasController=true, hasEntity=true."*
- *"Use get-create-endpoint-guide for moduleName=user, httpMethod=POST, description=Create user."*
- *"Use get-update-docs-guide for moduleName=account."*
- *"Use get-code-review-checklist with moduleName=user."*
- *"Use get-investigate-bug-guide with moduleName=user, bugDescription=Login fails with 500."*

---

## 6. Transport validation

All transports are covered by E2E tests (`npm run test:e2e`):

| Transport | Test file | Validated |
|-----------|-----------|-----------|
| Streamable HTTP | `test/e2e/transports/http/mcp-http.e2e-spec.ts` | `tools/list` (12), `tools/call` (8 of 12 exercised), 7 static resources, 3 templates, `prompts/list`, `resources/read` + `prompts/get` on fixture project |
| HTTP simple | `test/e2e/transports/http/mcp-http-simple.e2e-spec.ts` | Bootstrap, initialize session, reject without `X-Project-Root` |
| SSE | `test/e2e/transports/sse/mcp-sse.e2e-spec.ts` | Endpoint at `/sse`, `X-Project-Root` requirement |
| STDIO | `test/e2e/transports/stdio/mcp-stdio.e2e-spec.ts` | Initialize, `tools/list`, `tools/call` (8 of 12, same set as HTTP E2E), `resources/list`, `resources/read` (alaz://onboarding), `prompts/get` (create-module) |

**Note:** `prompts/get` is E2E-tested via HTTP (MCP SDK Client) and STDIO. Prompts return MCP GetPromptResult format (`{ messages: [...] }`).

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Project root is required" | Ensure `X-Project-Root` (HTTP/SSE) or `PROJECT_ROOT` (STDIO) is set in mcp.json |
| Connection refused | Start the server with `npm run start:dev` for HTTP/SSE |
| STDIO not found | Use absolute path for `cwd` in mcp.json |
| Framework not supported | Target project must be NestJS (package.json with @nestjs/core) |
| `invalid_union` on `resources/read` (e.g. `alaz://onboarding`) | Server must return MCP `ReadResourceResult` (`contents: [{ uri, mimeType, text }]`). Upgrade if you are on a build that predates that fix. |
