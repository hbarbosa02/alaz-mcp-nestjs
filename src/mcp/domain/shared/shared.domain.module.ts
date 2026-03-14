import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { RecentChangesTool } from '@mcp/domain/shared/feature/tools/recent-changes.tool';
import { ChangelogResource } from '@mcp/domain/shared/feature/resources/changelog.resource';
import { McpCoreModule } from '@mcp/core/mcp-core.module';
import { NestjsDomainModule } from '@mcp/domain/nestjs/nestjs.domain.module';

const MCP_SERVER_NAME = 'alaz-nestjs-mcp';

@Module({
  imports: [
    McpCoreModule,
    NestjsDomainModule,
    McpModule.forFeature([RecentChangesTool, ChangelogResource], MCP_SERVER_NAME),
  ],
  providers: [RecentChangesTool, ChangelogResource],
  exports: [RecentChangesTool, ChangelogResource],
})
export class SharedDomainModule {}
