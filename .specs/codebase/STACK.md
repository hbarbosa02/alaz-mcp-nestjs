# Tech stack

**Analyzed / synced:** 2026-04-25 (with `package.json`)

## Core

- **Framework:** NestJS 11 (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`)
- **Language:** TypeScript 5.9
- **Runtime:** Node.js (dev types: `@types/node` ^22)
- **Package manager:** npm (inferred from `package-lock` presence; lockfile not analyzed in this pass)

## Backend (this repository)

- **API style:** HTTP + MCP Streamable HTTP and SSE via `@rekog/mcp-nest` (`McpTransportType.STREAMABLE_HTTP`, `SSE`); no REST API for business domains in this repo
- **Configuration:** `@nestjs/config` with Zod validation (`env.schema` in `src/mcp/util/feature/schemas/env.schema.ts`)
- **Database:** N/A in the MCP server itself; analysis targets may use MikroORM, TypeORM, or Objection (detected in *target* `package.json`)

## MCP & protocol

- **SDK:** `@modelcontextprotocol/sdk` ^1.27
- **Nest integration:** `@rekog/mcp-nest` ^1.9
- **Schema / validation in tools:** `zod` 4
- **File globbing for analyzed projects:** `glob` 11

## Testing

- **Unit / integration (Jest):** Jest 29, `ts-jest` 29, `@types/jest` 29, `@nestjs/testing` 11
- **E2E:** Same Jest with `jest-e2e.config.js` (`testRegex: '.*\.e2e-spec\.ts$'`, `test/e2e/setup/env.setup.js`)

## External services (runtime product)

- **None required** for the MCP server to run: it reads the **analyzed** project’s files and (when available) `git` on disk. No bundled SaaS API for core behavior.

## Development tools

- **Build:** `@nestjs/cli` 11, TypeScript 5.9, `ts-node` 10, `tsconfig-paths` 4.2
- **Lint / format:** ESLint 9 (`typescript-eslint` 8, `@eslint/js`, `eslint-config-prettier`, `eslint-plugin-prettier`), `@stylistic/eslint-plugin` 5, Prettier 3
- **Local gate:** `npm run precommit` (lint + `format:check` + unit tests); `.githooks/pre-commit` runs the same when `core.hooksPath` is set via `npm install` / `prepare`
- **Path aliases:** `@/*` → `src/*`, `@mcp/*` domain splits, `@test/*` → `test/*` (see `tsconfig.json` and `jest.config.js`)

## Product documentation (operator)

- **`README.md`** — Landing: install, run, tool/resource index, link to full setup
- **`docs/MCP-SETUP.md`** — Canonical **full** `mcp.json` and transport options (see **AD-006** in `.specs/project/STATE.md`)
- **`docs/MCP-SERVER.md`**, **`docs/MCP-FLOWS-AND-ARCHITECTURE.md`**, **`docs/MCP-FRAMEWORK-PORTS.md`**, **`docs/CHANGELOG.md`**

## Frontend

- N/A (server-only; analyzed Angular projects are a future/placeholder concern in `src/mcp/domain/angular/`)
