# Alaz NestJS MCP

**Vision:** A Model Context Protocol server that turns a NestJS (and future framework) workspace into live, queryable context for AI clients.

**For:** Teams and individuals using Cursor, Claude Desktop, GitHub Copilot, or any MCP client that needs accurate project state without manual copy-paste.

**Solves:** AI assistants often lack up-to-date module structure, ORM entity shapes, API surface, conventions, and recent git activity; this server exposes that context as tools, resources, and prompts.

## Goals

- **G1 — Trustworthy context:** Responses reflect the configured project root (HTTP header or `PROJECT_ROOT` in STDIO) and the detected stack (ORM, validation, tests, queues).
- **G2 — Low-friction adoption:** Clear HTTP and STDIO/Docker paths documented in `README.md` and `docs/MCP-SETUP.md`; no secrets required in repo for basic use.
- **G3 — Extensible framework layer:** Adapters and ports allow NestJS first, with a path to other stacks without rewriting the core MCP surface.
- **G4 — Observable quality:** lint, unit tests, and e2e transports stay green for releases; changelog and semver track user-visible changes.

## Tech Stack

**Core:**

- Framework: NestJS 11
- Language: TypeScript 5.9
- Runtime: Node.js (see `@types/node` 22 in dev)

**Key dependencies:** `@modelcontextprotocol/sdk` ^1.27, `@rekog/mcp-nest` ^1.9, `zod` 4, `glob` 11, `jest` 29, `@nestjs/*` 11

## Scope

**v1 includes (shipped in current line, e.g. 1.3.x):**

- HTTP MCP transport with `X-Project-Root` and streamable configuration aligned with current MCP clients
- STDIO entry for local/workspace analysis without a long-lived HTTP process
- Stack detection from `package.json` (and composer for PHP paths where applicable)
- Tools: `list-modules`, `get-module-detail`, `get-entity-schema`, `list-endpoints`, `check-conventions`, `get-recent-changes`, `get-test-summary`
- Resources: onboarding, architecture, conventions, changelog, module/entity deep links (`alaz://` URIs)
- Docker support for both transports

**Explicitly out of scope (for this product, not the analyzed target app):**

- Hosting or deploying end-user Nest applications
- Storing or enforcing secrets inside the server beyond normal env (port, `PROJECT_ROOT` where needed)
- Replacing the IDE, Git, or ORM—this server *describes* the project; it does not run the user’s app by default

## Constraints

- **Technical:** Project root must be supplied by MCP config (or override per call); the server does not guess arbitrary disk paths in production.
- **Compatibility:** Must stay aligned with `@modelcontextprotocol/sdk` and client expectations (e.g. resource and prompt result shapes).
- **Resources:** Ongoing maintenance and feature work depend on available maintainer time; prioritize correctness of exposed context over breadth of new tools.

## References

- Root README: `README.md`
- Changelog: `docs/CHANGELOG.md`
- Server details: `docs/MCP-SERVER.md`, `docs/MCP-SETUP.md`
