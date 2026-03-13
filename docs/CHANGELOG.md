# Changelog

## [Unreleased]

### Added

- E2E test suite for HTTP, SSE, and STDIO transports (validated by npm run test:e2e)
- MCP-SETUP.md with step-by-step configuration for Cursor, Claude Desktop, Copilot
- example prompts for requesting information from the MCP

### Changed

- apply Option C for static resources (delegate to framework adapter)
- extend IDocumentationReader port with getApiOverview, getCursorRules, getTestingDocs, readDoc, getChangelog

### Fixed

- remove inline exceptions (eslint-disable), add no-console override for entry files
- resources return MCP ReadResourceResult format for Cursor compatibility (fixes invalid_union when reading alaz:// URIs)

### Documentation

- update MCP-SERVER.md with transport validation note and setup reference
- update MCP-FRAMEWORK-PORTS and MCP-FLOWS-AND-ARCHITECTURE for Option C
- update README with link to MCP-SETUP.md

## [1.2.0] - 2026-03-13

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
