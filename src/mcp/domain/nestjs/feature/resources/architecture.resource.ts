import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';

@Injectable()
export class ArchitectureResource {
  constructor(
    private readonly frameworkDetector: FrameworkDetectorService,
    private readonly adapterRegistry: FrameworkAdapterRegistryService,
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
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg =
      this.adapterRegistry.getUnsupportedMessage(framework);
    if (unsupportedMsg) {
      this.mcpLogger.logResourceResult(
        'alaz://architecture',
        unsupportedMsg.length,
      );
      return unsupportedMsg;
    }
    const docReader = this.adapterRegistry.getDocumentationReader(framework)!;
    const projectContext = this.adapterRegistry.getProjectContext(framework)!;
    const content = await docReader.getApiOverview();
    const context = await projectContext.getContext();
    const fallbackPath =
      context.docsLayout.apiOverview ?? 'docs/architecture/API-OVERVIEW.md';
    const result =
      content ?? `# Architecture\n\nDocumentation not found at ${fallbackPath}`;
    this.mcpLogger.logResourceResult('alaz://architecture', result.length);
    return result;
  }
}
