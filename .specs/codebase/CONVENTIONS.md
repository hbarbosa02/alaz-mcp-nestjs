# Code Conventions

Observed in this repository (MCP server code and tests). Conventions for **analyzed** NestJS apps are documented separately in `.cursor/rules/` (e.g. `api-conventions.mdc`, `module-architecture.mdc`).

## Naming

**Files**

- `*.ts` for implementation; `*.spec.ts` unit tests under `test/unit/...`; `*.e2e-spec.ts` under `test/e2e/transports/`
- Domain layout: `feature/tools|resources|prompts/`, `data-access/services/`, `data-access/strategies/`
- **Examples:** `entity-schema.tool.ts`, `framework-adapter-registry.service.ts`, `project-root.middleware.ts`

**MCP tools:** `kebab-case` names in `@Tool({ name: 'get-entity-schema', ... })` (see `.cursor/rules/mcp-development.mdc`)

**Classes:** PascalCase — `ModuleExplorerTool`, `ProjectRootContextService`, `FrameworkDetectorService`

**Constants / message strings:** SCREAMING_SNAKE for shared exports — e.g. `UNSUPPORTED_FRAMEWORK_MESSAGE`, `PROJECT_ROOT_REQUIRED` in `project-root-context.service.ts`

**Zod env:** `envSchema` in `env.schema.ts`, parsed by `ConfigModule` in `app.module.ts`

## Imports

- Path aliases: `@/`, `@mcp/core/`, `@mcp/domain/nestjs/`, `@mcp/domain/shared/`, `@mcp/util/`, tests `@test/`
- **Example:** `import { McpCoreModule } from '@/mcp/core/mcp-core.module';` in `mcp.module.ts`

## Type safety

- `strictNullChecks`, `noImplicitAny` enabled in `tsconfig.json`
- Zod for environment and tool parameters; ports expressed as `interface` / `type` imports

## Error handling

- Contextual `Error` messages (see `.cursor/rules/code-convention.mdc`); e.g. `ProjectRootMiddleware` returns JSON with explicit `X-Project-Root` configuration hint
- Framework adapter registry returns `null` and separate user-facing strings instead of throwing for unsupported frameworks in some call paths (see `getUnsupportedMessage`)

## Comments

- JSDoc or short `//` where non-obvious (e.g. `enterWith` “Do not use for HTTP” in `project-root-context.service.ts`)
- Placeholder modules (`angular`, `laravel`) document future intent in module-level comments

## Project-specific rules

- `.cursor/rules/mcp-development.mdc`: tool/resource/prompt registration locations, `withConfirmationRequirement` for executable-step prompts, naming of `alaz://` URIs
- **TLC / `.specs/`:** When shipping AD-level or user-visible doc changes, update `.specs/project/STATE.md` and relevant `codebase/*.md` so brownfield and decisions stay in sync (see tlc-spec-driven `state-management`).

