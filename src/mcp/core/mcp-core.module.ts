import { Module } from '@nestjs/common';
import { ProjectRootContextService } from '@mcp/core/data-access/services/project-root-context.service';
import { PathResolverService } from '@mcp/core/data-access/services/path-resolver.service';
import { FileReaderService } from '@mcp/core/data-access/services/file-reader.service';
import { GitContextService } from '@mcp/core/data-access/services/git-context.service';
import { GitChangelogService } from '@mcp/core/data-access/services/git-changelog.service';
import { McpLoggerService } from '@mcp/core/data-access/services/mcp-logger.service';
import { FrameworkDetectorService } from '@mcp/core/data-access/services/framework-detector.service';
import { ProjectRootMiddleware } from '@mcp/core/feature/middleware/project-root.middleware';

@Module({
  providers: [
    ProjectRootContextService,
    PathResolverService,
    FileReaderService,
    GitContextService,
    GitChangelogService,
    McpLoggerService,
    FrameworkDetectorService,
    ProjectRootMiddleware,
  ],
  exports: [
    ProjectRootContextService,
    PathResolverService,
    FileReaderService,
    GitContextService,
    GitChangelogService,
    McpLoggerService,
    FrameworkDetectorService,
    ProjectRootMiddleware,
  ],
})
export class McpCoreModule {}
