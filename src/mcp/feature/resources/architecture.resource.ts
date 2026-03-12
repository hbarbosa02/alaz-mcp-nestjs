import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import { DocumentationReaderService } from '@/mcp/data-access/services/documentation-reader.service';
import { ProjectContextService } from '@/mcp/data-access/services/project-context.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

@Injectable()
export class ArchitectureResource {
  constructor(
    private readonly docReader: DocumentationReaderService,
    private readonly projectContext: ProjectContextService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Resource({
    uri: 'alaz://architecture',
    name: 'Architecture',
    description: 'Project architecture overview',
    mimeType: 'text/markdown',
  })
  async getArchitecture(): Promise<string> {
    this.mcpLogger.logResourceRead('alaz://architecture', {});
    const context = await this.projectContext.getContext();
    const content = await this.docReader.getApiOverview();
    const fallbackPath =
      context.docsLayout.apiOverview ?? 'docs/architecture/API-OVERVIEW.md';
    const result =
      content ??
      `# Architecture\n\nDocumentation not found at ${fallbackPath}`;
    this.mcpLogger.logResourceResult('alaz://architecture', result.length);
    return result;
  }
}
