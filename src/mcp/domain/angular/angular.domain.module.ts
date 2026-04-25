import { Module } from '@nestjs/common';

/**
 * Placeholder domain for future Angular adapters. Imported by `McpNestjsModule` / `McpStdioModule`
 * so real providers can land here without rewiring the graph (AD-003).
 *
 * When implemented: register services that implement the core ports under `src/mcp/core/ports/`,
 * then route them from `FrameworkAdapterRegistryService` when `FrameworkDetectorService` reports `angular`.
 */
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class AngularDomainModule {}
