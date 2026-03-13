import { Module } from '@nestjs/common';
import { RecentChangesTool } from './feature/tools/recent-changes.tool';
import { ChangelogResource } from './feature/resources/changelog.resource';
import { McpCoreModule } from '@/mcp/core/mcp-core.module';
import { NestjsDomainModule } from '@/mcp/domain/nestjs/nestjs.domain.module';

@Module({
  imports: [McpCoreModule, NestjsDomainModule],
  providers: [RecentChangesTool, ChangelogResource],
  exports: [RecentChangesTool, ChangelogResource],
})
export class SharedDomainModule {}
