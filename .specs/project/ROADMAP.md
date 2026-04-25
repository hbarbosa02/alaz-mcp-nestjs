# Roadmap

**Current milestone:** 1.3.x — Transports, Docker, quality, and documentation
**Status:** In progress (patch/minor as `docs/CHANGELOG.md` and tags indicate)

---

## 1.3.x — Transports, Docker, quality, documentation

**Goal:** Keep HTTP, SSE, and STDIO reliable; keep operator docs accurate and **DRY** (single home for `mcp.json` long form in `docs/MCP-SETUP.md`); extend tests and resources so MCP clients get consistent responses.

### Done / stable (as of last `.specs` sync)

- E2E coverage for HTTP, SSE, STDIO; `prompts/get` and resource shapes aligned with MCP `ReadResourceResult` / `GetPromptResult`
- JSON/streamable HTTP behavior; framework detection cache (LRU, per-root) and STDIO `ProjectRootContext` fallbacks
- DDD-style `src` / `test` layout; `npm run precommit` (lint, format, unit tests) via `.githooks`
- Docker Compose for HTTP and STDIO-oriented runs; `README` + **MCP-SETUP** describe usage
- **Documentation pass:** `README` shortened; `MCP-SETUP` owns full `mcp.json` variants; `MCP-SERVER` is technical reference without duplicate JSON blocks (see `STATE` quick task 005 and **AD-006**)

### Still in motion (unreleased or iterative)

- Further changelog items under `docs/CHANGELOG.md` **[Unreleased]** until the next tag
- Ongoing **CONCERNS** items: security posture for non-localhost HTTP, path hardening, adapter completeness for non-Nest frameworks

---

## Next (planned / TBD)

**Goal:** Advance multi-framework work only with concrete need and tests; avoid core scope creep.

### Features

- **Non-NestJS adapters (Angular, Laravel):** Placeholder modules wired; real adapters + registry routing still **deferred** (see `STATE.md` *Deferred ideas*)
- **New tools / resources:** Only with a clear, repeatable agent workflow; update `docs/MCP-SERVER.md` and changelog

---

## Future considerations

- Deeper ORM / edge-case introspection without running the target app’s runtime
- Optional auth or project allowlists if the server is ever exposed beyond localhost (product decision; not in current v1)
