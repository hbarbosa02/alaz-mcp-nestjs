import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { GitChangelogService } from '@/mcp/core/data-access/services/git-changelog.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';

@Injectable()
export class ChangelogResource {
  constructor(
    private readonly frameworkDetector: FrameworkDetectorService,
    private readonly adapterRegistry: FrameworkAdapterRegistryService,
    private readonly gitChangelog: GitChangelogService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Resource({
    uri: 'alaz://changelog',
    name: 'Changelog',
    description:
      'Project changelog (Git-based when available, else static docs)',
    mimeType: 'text/markdown',
  })
  async getChangelog(): Promise<string> {
    this.mcpLogger.logResourceRead('alaz://changelog', {});
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg =
      this.adapterRegistry.getUnsupportedMessage(framework);
    if (unsupportedMsg) {
      this.mcpLogger.logResourceResult(
        'alaz://changelog',
        unsupportedMsg.length,
      );
      return unsupportedMsg;
    }
    const docReader = this.adapterRegistry.getDocumentationReader(framework)!;
    const gitContent = await this.gitChangelog.generateChangelog();
    const content =
      gitContent && gitContent.length > 0
        ? gitContent
        : await docReader.getChangelog();
    const result =
      content ??
      '# Changelog\n\nDocumentation not found at docs/changes/4 - Changelog.md';
    this.mcpLogger.logResourceResult('alaz://changelog', result.length);
    return result;
  }
}
