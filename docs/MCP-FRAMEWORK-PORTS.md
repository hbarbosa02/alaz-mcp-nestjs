# MCP Framework Port Interfaces

This document describes the interface contracts (ports) that each framework domain must implement to integrate with the MCP. NestJS adapters already implement these interfaces; Angular and Laravel are planned.

## Main Ports

### IModuleRegistry

Lists and retrieves information about project modules.

```typescript
interface IModuleRegistry {
  listModules(): Promise<ModuleInfo[]>;
  getModule(name: string): Promise<ModuleInfo | null>;
}
```

| Framework | Equivalent | Status |
|-----------|-------------|--------|
| NestJS | `*.module.ts` in `src/` | Implemented |
| Angular | `*.module.ts` in `src/app/` | Coming soon |
| Laravel | Modules/namespaces in `app/` | Coming soon |

### IEntityIntrospector

Inspects project entities/models (ORM, schema).

```typescript
interface IEntityIntrospector {
  listEntities(ormOverride?: OrmType): Promise<EntitySchema[]>;
  getEntitySchema(entityName: string, ormOverride?: OrmType): Promise<EntitySchema | null>;
}
```

| Framework | Equivalent | Status |
|-----------|-------------|--------|
| NestJS | MikroORM, TypeORM, Objection entities | Implemented |
| Angular | N/A (frontend) — possibly services/state | Coming soon |
| Laravel | Eloquent Models | Coming soon |

### ICodebaseAnalyzer

Analyzes API endpoints/routes.

```typescript
interface ICodebaseAnalyzer {
  getEndpoints(moduleName?: string): Promise<EndpointInfo[]>;
  getModuleEndpoints(moduleName: string): Promise<EndpointInfo[]>;
}
```

| Framework | Equivalent | Status |
|-----------|-------------|--------|
| NestJS | Controllers with `@Get`, `@Post`, etc. | Implemented |
| Angular | N/A (frontend) | Coming soon |
| Laravel | Controllers, routes in `routes/` | Coming soon |

### IDocumentationReader

Reads project documentation.

```typescript
interface IDocumentationReader {
  getFeatureDoc(moduleName: string): Promise<string | null>;
  getArchitectureDocs(): Promise<Record<string, string>>;
  getApiConventions(): Promise<string | null>;
  getReadme(): Promise<string | null>;
  /** API overview doc (e.g. docs/architecture/API-OVERVIEW.md) */
  getApiOverview(): Promise<string | null>;
  /** Cursor rules from .cursor/rules/ */
  getCursorRules(): Promise<Record<string, string>>;
  /** Testing conventions doc */
  getTestingDocs(): Promise<string | null>;
  /** Read doc at relative path */
  readDoc(relativePath: string): Promise<string | null>;
  /** Changelog doc (e.g. docs/CHANGELOG.md, docs/changes/*.md) */
  getChangelog(): Promise<string | null>;
}
```

### IProjectContext

Provides project context (patterns, stack, docs layout).

```typescript
interface IProjectContext {
  getContext(): Promise<ProjectContext>;
}
```

## Shared Types

Defined in `src/mcp/core/ports/types.ts`:

- `ModuleInfo` — name, path, hasController, entityNames, etc.
- `EntitySchema` — name, tableName, properties, relations
- `EndpointInfo` — method, path, controllerClass, permissions, authType

## FrameworkAdapterRegistry

The `FrameworkAdapterRegistryService` (in `src/mcp/domain/nestjs/data-access/services/`) returns the correct adapter based on the detected framework:

- `nestjs` → NestJS adapters (implemented)
- `angular` → `null` (message "Coming soon")
- `laravel` → `null` (message "Coming soon")
- `null` → message "Framework not supported"

## Equivalents by Framework

Current interfaces are NestJS-oriented. Other frameworks may expose conceptual equivalents:

| NestJS Port        | Angular Equivalent        | Laravel Equivalent        |
|---------------------|----------------------------|----------------------------|
| `IModuleRegistry`   | `IComponentRegistry`       | `IModuleRegistry` (namespaces) |
| `IEntityIntrospector` | N/A (frontend) or services/state | `IModelRegistry` (Eloquent) |
| `ICodebaseAnalyzer` | N/A (frontend) or service routes | `IRouteAnalyzer` (routes/) |
| `IDocumentationReader` | Yes (project docs)     | Yes (project docs)      |
| `IProjectContext`   | Yes (angular.json, tsconfig) | Yes (composer.json, config/) |

**Note:** Angular may prioritize `IComponentRegistry` for components and NgModules. Laravel may prioritize `IModelRegistry` for Eloquent Models and `IRouteAnalyzer` for routes in `routes/`. The decision to map to existing ports or create new ones is left for future implementation.

## Future Implementation

To add support for Angular or Laravel:

1. Implement the interfaces in `mcp/domain/angular/` or `mcp/domain/laravel/`
2. Register the adapters in `FrameworkAdapterRegistryService`
3. Update `FrameworkDetectorService` if needed (composer.json for Laravel)
4. Add `AngularDomainModule` or `LaravelDomainModule` to `McpModule` imports

---

## Future Considerations (Phase 4)

### Multi-manifest detection (Laravel and composer.json)

The `FrameworkDetectorService` already supports multi-manifest detection:

- **package.json**: NestJS (`@nestjs/core`), Angular (`@angular/core`)
- **composer.json**: Laravel (`laravel/framework` in `require` or `require-dev`)

Verification order: first `package.json`, then `composer.json`. Pure PHP projects (Laravel) do not have `package.json` with framework dependencies; Node projects may have both (e.g. Laravel + Vite).

Detection contract:

1. Read `package.json` → if `@nestjs/core` or `@angular/core` → return framework
2. Read `composer.json` → if `laravel/framework` → return `laravel`
3. Otherwise → return `null`

### Static resource strategy (alaz://)

**Implemented: Option C** — Generic resources that delegate to the framework adapter.

Static resources such as `alaz://conventions/api`, `alaz://authentication`, `alaz://architecture`:

- **Option A**: Keep as NestJS templates until framework equivalents exist
- **Option B**: Create variants per framework (`alaz://conventions/nestjs`, `alaz://conventions/laravel`, etc.)
- **Option C** ✓: Generic resources that delegate to the framework adapter (e.g. `alaz://conventions/api` → adapter returns content based on framework)

Each resource (`ArchitectureResource`, `ConventionsResource`, `AuthenticationResource`, `OnboardingResource`, `ChangelogResource`, `ModuleDocsResource`, `ModuleEndpointsResource`, `EntityDiagramResource`) injects `FrameworkDetectorService` and `FrameworkAdapterRegistryService`. Flow: detect framework → if not supported return "Coming soon" message → otherwise get adapter from registry and delegate. URIs remain generic; content varies by detected framework.

### Prompt equivalents by framework

| NestJS (current) | Angular (future) | Laravel (future) |
|----------------|------------------|-------------------|
| `create-module` | `create-component` | `create-module` or `make:module` |
| `create-endpoint` | N/A (frontend) | `create-controller` / `make:controller` |
| `update-documentation` | `update-documentation` | `update-documentation` |
| `code-review` | `code-review` | `code-review` |
| `investigate-bug` | `investigate-bug` | `investigate-bug` |

Create a "Future framework prompts" section in docs when implementing Angular/Laravel. NestJS-specific prompts (`create-module`, `create-endpoint`) will have conceptual equivalents in each ecosystem.
