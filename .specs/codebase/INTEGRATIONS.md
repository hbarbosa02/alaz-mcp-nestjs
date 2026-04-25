# External Integrations

This document covers **out-of-process and third-party** dependencies the MCP server uses at runtime or build time, and what it **interacts** with in the user’s environment.

## Protocol and Nest MCP bridge

| Item | Role |
| ---- | ---- |
| `@modelcontextprotocol/sdk` | MCP client usage in E2E; protocol types and streamable HTTP client transport |
| `@rekog/mcp-nest` | Declarative `McpModule`, `@Tool` / `@Resource` / `@Prompt` registration, Streamable HTTP + SSE |

**Implementation:** `src/mcp/feature/mcp.module.ts` (`McpModule.forRoot` + `McpModule.forFeature` in domain modules)

## Analyzed project (the “target” repository)

- **Not** a network integration: the server reads the **file system** under `X-Project-Root` (HTTP) or `PROJECT_ROOT` (STDIO) using Node `fs` (via abstractions in `FileReaderService`, `PathResolverService`, `glob` for discovery).
- **Package manifests:** `package.json` and optional `composer.json` for `FrameworkDetectorService` (dependency keys such as `@nestjs/core`, `laravel/framework`).

**Authentication:** None for reading local files; security is **operational** (file permissions, not exposing the HTTP server beyond trusted networks, path traversal considerations in resolvers—see `CONCERNS.md` if applicable).

## Git (local)

- **Git CLI / `.git` directory:** `GitContextService` and `GitChangelogService` in `src/mcp/core/data-access/services/` for recent commits and changelog material when the target is a git repo
- **No** remote hosting API: no GitHub/GitLab API key required for default behavior

## HTTP transport (MCP product server)

- **Express** (via `@nestjs/platform-express`): default Nest HTTP stack
- **Client integration:** Any MCP client that can send `X-Project-Root` to `http://host:port/mcp` (documented in `README.md`, `docs/MCP-SETUP.md`)

**Webhooks / REST callbacks:** None in this codebase for the MCP process itself.

## Configuration / environment

- **`@nestjs/config`:** Load `.env` if present; validate with `envSchema` (Zod)
- **Relevant env vars:** `PORT` (default 3100), `NODE_ENV`, `PROJECT_ROOT` (for STDIO and fallback when ALS store missing)

**Secrets:** The product does not define cloud API keys in-repo; `.env` is for local port/env only (treat as sensitive in deployment).

## Optional / not present

- **Databases, Redis, message queues:** Not used by the MCP server process
- **SSO / OAuth for MCP:** Not implemented; add only if a hosted multi-tenant product is future scope

## Summary

| Category        | Technology | Notes |
| --------------- | ---------- | ----- |
| MCP wire        | Streamable HTTP, SSE, STDIO | Via `@rekog/mcp-nest` |
| Target analysis | File system + optional git  | No outbound project APIs |
| Build           | npm + Nest + TypeScript     | See `STACK.md` |
