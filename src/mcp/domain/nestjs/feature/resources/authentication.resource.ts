import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { toReadResourceResult } from '@/mcp/core/util/read-resource-result.util';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { requireAdapter } from '@/mcp/util/require-adapter.util';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';

@Injectable()
export class AuthenticationResource {
  constructor(
    private readonly frameworkDetector: FrameworkDetectorService,
    private readonly adapterRegistry: FrameworkAdapterRegistryService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Resource({
    uri: 'alaz://authentication',
    name: 'Authentication',
    description: 'Authentication and authorization: JWT, Auth0, RBAC',
    mimeType: 'text/markdown',
  })
  async getAuthentication() {
    this.mcpLogger.logResourceRead('alaz://authentication', {});
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg =
      this.adapterRegistry.getUnsupportedMessage(framework);

    if (unsupportedMsg) {
      this.mcpLogger.logResourceResult(
        'alaz://authentication',
        unsupportedMsg.length,
      );
      return toReadResourceResult(
        'alaz://authentication',
        'text/markdown',
        unsupportedMsg,
      );
    }
    const docReader = requireAdapter(
      this.adapterRegistry.getDocumentationReader(framework),
      'DocumentationReader',
      framework,
    );
    const content = await docReader.readDoc(
      'docs/architecture/AUTHENTICATION.md',
    );
    const result =
      content ??
      '# Authentication\n\nDocumentation not found at docs/architecture/AUTHENTICATION.md';
    this.mcpLogger.logResourceResult('alaz://authentication', result.length);
    return toReadResourceResult(
      'alaz://authentication',
      'text/markdown',
      result,
    );
  }
}
