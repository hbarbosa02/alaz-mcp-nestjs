import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import { DocumentationReaderService } from '@/mcp/data-access/services/documentation-reader.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

@Injectable()
export class ArchitectureResource {
  constructor(
    private readonly docReader: DocumentationReaderService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Resource({
    uri: 'alaz://architecture',
    name: 'Architecture',
    description: 'projeto-X project architecture overview',
    mimeType: 'text/markdown',
  })
  async getArchitecture(): Promise<string> {
    this.mcpLogger.logResourceRead('alaz://architecture', {});
    const content = await this.docReader.getApiOverview();
    const result =
      content ??
      '# Architecture\n\nDocumentation not found at docs/architecture/API-OVERVIEW.md';
    this.mcpLogger.logResourceResult('alaz://architecture', result.length);
    return result;
  }
}
