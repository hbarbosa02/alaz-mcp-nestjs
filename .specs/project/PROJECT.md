# Alaz NestJS MCP

**Vision:** A [Model Context Protocol](https://modelcontextprotocol.io/) server that turns a NestJS (and, later, other framework) workspace into **live, queryable context** for AI clients.

**Audience:** Teams and individuals using Cursor, Claude Desktop, GitHub Copilot, or any MCP host that can call tools, read resources, and (where supported) run prompts.

**Problem:** Assistants often lack current module structure, ORM entity shapes, HTTP surface, conventions, and recent Git history. This server exposes that as **tools**, **resources**, and **prompts** rooted at a configured project path.

## Goals

- **G1 — Trustworthy context:** Answers reflect the configured project root (`X-Project-Root` for HTTP/SSE, `PROJECT_ROOT` for STDIO) and the detected stack (ORM, validation, tests, queues, etc.).
- **G2 — Low-friction adoption:** Operator docs in `README.md` (landing) and **`docs/MCP-SETUP.md` (full `mcp.json` and transport matrix)**; no repository secrets for basic use.
- **G3 — Extensible framework layer:** Ports and adapters keep the MCP surface stable; NestJS is fully implemented, Angular/Laravel are placeholders until adapters exist.
- **G4 — Observable quality:** Lint, unit tests, E2E transports, and `precommit` stay green; semver and `docs/CHANGELOG.md` track this **product** repo (not the analyzed app).

## Tech stack (this repository)

- **Runtime:** Node.js 18+ (dev types target Node 22 per `package.json`)
- **Framework:** NestJS 11, TypeScript 5.9
- **MCP:** `@modelcontextprotocol/sdk` ^1.27, `@rekog/mcp-nest` ^1.9, Zod 4

Details: [`.specs/codebase/STACK.md`](../codebase/STACK.md)

## Scope

**Shipped in the current line (e.g. 1.3.x):**

- Streamable HTTP (`/mcp`) and SSE (`/sse`) with `X-Project-Root`; STDIO entry without a long-lived HTTP process
- Stack / framework hints from target `package.json` and `composer.json` when present
- **12 tools** — module/entity/endpoint exploration, conventions, Git and test summaries, and **five “prompt-as-tool” guides** for clients that do not expose `prompts/get` (see `README.md` and `docs/MCP-SERVER.md`)
- **Resources** — static `alaz://` URIs plus module/entity templates; static resources use **Option C** (delegate via framework adapter; see `docs/MCP-FRAMEWORK-PORTS.md`)
- **Five prompts** — parity with the guide tools where applicable
- Docker image/compose for HTTP and STDIO-style runs

**Out of scope (this product, not the analyzed Nest app):**

- Hosting or running the user’s production Nest application
- Storing end-user secrets beyond normal process env (`PORT`, optional local `.env`); analyzed path comes from MCP config, not guessing disks
- Replacing the IDE, Git, or ORM — the server **describes** the tree; it does not execute the target app

## Constraints

- **Config:** Project root is required from MCP config (or per-tool `projectRoot` override). No silent default to an arbitrary path in production (see `env.schema` and **AD-001** in `STATE.md`).
- **Protocol:** Stay aligned with MCP resource/prompt result shapes expected by current clients.
- **Maintenance:** Favor correctness of exposed context over growing tool count without clear agent workflows.

## References

| Artifact | Role |
|----------|------|
| `README.md` | Quick install, one HTTP `mcp.json` example, tool/resource index |
| `docs/MCP-SETUP.md` | **Canonical** client setup: HTTP, SSE, STDIO, Docker, Cursor/Claude/Copilot |
| `docs/MCP-SERVER.md` | Tools, resources, prompts, env, extension points |
| `docs/MCP-FLOWS-AND-ARCHITECTURE.md` | Flows, Mermaid diagrams, `src/mcp` layout |
| `docs/MCP-FRAMEWORK-PORTS.md` | Port interfaces, registry, future frameworks |
| `docs/CHANGELOG.md` | This repository’s release history |
| `.specs/` | TLC spec-driven project memory and brownfield map |
