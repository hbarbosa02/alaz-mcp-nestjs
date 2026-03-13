# Changelog

## [Unreleased]

### Documentation

- add MCP flows and architecture report with Mermaid diagrams

### Changed

- apply code formatting across services and resources
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
