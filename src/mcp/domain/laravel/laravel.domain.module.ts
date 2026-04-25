import { Module } from '@nestjs/common';

/**
 * Placeholder domain for future Laravel adapters. Imported by `McpNestjsModule` / `McpStdioModule`
 * so real providers can land here without rewiring the graph (AD-003).
 *
 * When implemented: register port implementations, then extend `FrameworkAdapterRegistryService`
 * for `framework === 'laravel'` (detection already reads `composer.json` for `laravel/framework`).
 */
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class LaravelDomainModule {}
