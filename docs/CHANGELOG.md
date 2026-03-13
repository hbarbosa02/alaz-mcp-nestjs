# Changelog

## [Unreleased]

### Added

- FrameworkDetectorService for package.json and composer.json detection
- empty Angular and Laravel domain modules (placeholders)

### Documentation

- MCP-FRAMEWORK-PORTS.md with interface contracts and future considerations
- Laravel/composer.json multi-manifest detection contract
- static resources strategy (alaz://) and prompt equivalents per framework
- framework adapter ports (IModuleRegistry, IEntityIntrospector, ICodebaseAnalyzer, IDocumentationReader, IProjectContext)
- FrameworkAdapterRegistry with routing to NestJS adapters
- tools return clear message when framework is unsupported or coming soon

### Changed

- reorganize MCP into DDD structure (core, domain/nestjs, domain/shared)
- apply code formatting across services and resources

### Documentation

- add MCP flows and architecture report with Mermaid diagrams
- **MCP project-agnostic**: project root from mcp.json config (env.PROJECT_ROOT for STDIO, headers["X-Project-Root"] for HTTP) instead of fixed env; no fallback — missing path returns MCP error

## [1.1.0] - 2026-03-12

### Added

- package.json stack detection (ORM, validation, test framework)
- Git-based changelog resource with tag versioning
- multi-ORM entity parser strategies (MikroORM, TypeORM, Objection)

### Changed

- prompts and resources adapt to project context (NewModulePrompt, NewEndpointPrompt, OnboardingResource)
- ConventionCheckerTool and TestInfoTool use stack detection

## [1.0.0] - 2026-03-11

### Added

- initial Alaz MCP Server for projeto-X NestJS context

### Other

- Initial commit
