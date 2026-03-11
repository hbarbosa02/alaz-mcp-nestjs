import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import { DocumentationReaderService } from '@/mcp/data-access/services/documentation-reader.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

@Injectable()
export class ChangelogResource {
  constructor(
    private readonly docReader: DocumentationReaderService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Resource({
    uri: 'alaz://changelog',
    name: 'Changelog',
    description: 'Recent project changes',
    mimeType: 'text/markdown',
  })
  async getChangelog(): Promise<string> {
    this.mcpLogger.logResourceRead('alaz://changelog', {});
    const content = await this.docReader.getChangelog();
    const result =
      content ??
      '# Changelog\n\nDocumentation not found at docs/changes/4 - Changelog.md';
    this.mcpLogger.logResourceResult('alaz://changelog', result.length);
    return result;
  }
}
