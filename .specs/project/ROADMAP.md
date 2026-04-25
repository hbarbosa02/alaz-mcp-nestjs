# Roadmap

**Current milestone:** 1.3.x — Maintenance, Docker, and transport hardening
**Status:** In Progress

---

## 1.3.x — Maintenance, Docker, and transport hardening

**Goal:** Keep HTTP, SSE, and STDIO paths reliable; document Docker; improve tests and static resources so MCP clients get consistent responses.

**Target:** Ongoing; patch/minor releases as `docs/CHANGELOG.md` and tags indicate.

### Features

**Core MCP server (HTTP + resources + prompts)** — IN PROGRESS (active unreleased work per changelog)

- JSON/streamable HTTP behavior and prompt `GetPromptResult` compliance
- Framework detection caching and `PROJECT_ROOT` fallbacks for STDIO
- Test layout aligned with DDD-style source tree; E2E coverage for transports

**Operations (Docker, docs)** — IN PROGRESS

- `docker compose` for HTTP and STDIO modes documented in README and `docs/`

**E2E and quality** — IN PROGRESS

- E2E tests for `prompts/get` and transport surfaces; coverage thresholds and exclusions tuned for real code

---

## Next (planned / TBD)

**Goal:** Move multi-framework story forward only where it pays off; avoid scope creep in core.

### Features

**Non-NestJS adapters (Angular, Laravel)** — PLANNED

- Placeholder domains exist; expand only when there is a concrete client need and test strategy

**Additional tools / resources** — PLANNED

- New tools only when a clear, repeatable agent workflow needs them; document in `docs/MCP-SERVER.md` and changelog

---

## Future considerations

- Deeper framework-specific introspection (e.g. more ORM edge cases) without duplicating the target app’s runtime
- Optional auth or project allowlists if server is ever exposed beyond localhost (product decision not in current v1)
