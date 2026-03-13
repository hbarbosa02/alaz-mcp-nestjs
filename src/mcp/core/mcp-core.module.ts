import { Module } from '@nestjs/common';
import { ProjectRootContextService } from './data-access/services/project-root-context.service';
import { PathResolverService } from './data-access/services/path-resolver.service';
import { FileReaderService } from './data-access/services/file-reader.service';
import { GitContextService } from './data-access/services/git-context.service';
import { GitChangelogService } from './data-access/services/git-changelog.service';
import { McpLoggerService } from './data-access/services/mcp-logger.service';
import { FrameworkDetectorService } from './data-access/services/framework-detector.service';
import { ProjectRootMiddleware } from './feature/middleware/project-root.middleware';

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
