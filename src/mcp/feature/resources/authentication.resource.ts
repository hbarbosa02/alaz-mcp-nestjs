import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import { DocumentationReaderService } from '@/mcp/data-access/services/documentation-reader.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

@Injectable()
export class AuthenticationResource {
  constructor(
    private readonly docReader: DocumentationReaderService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Resource({
    uri: 'alaz://authentication',
    name: 'Authentication',
    description: 'Authentication and authorization: JWT, Auth0, RBAC',
    mimeType: 'text/markdown',
  })
  async getAuthentication(): Promise<string> {
    this.mcpLogger.logResourceRead('alaz://authentication', {});
    const content = await this.docReader.readDoc(
      'docs/architecture/AUTHENTICATION.md',
    );
    const result =
      content ??
      '# Authentication\n\nDocumentation not found at docs/architecture/AUTHENTICATION.md';
    this.mcpLogger.logResourceResult('alaz://authentication', result.length);
    return result;
  }
}
