import { Injectable } from '@nestjs/common';
import { ResourceTemplate } from '@rekog/mcp-nest';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';

@Injectable()
export class ModuleDocsResource {
  constructor(
    private readonly frameworkDetector: FrameworkDetectorService,
    private readonly adapterRegistry: FrameworkAdapterRegistryService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @ResourceTemplate({
    uriTemplate: 'alaz://modules/{moduleName}',
    name: 'Module Docs',
    description: 'Module documentation and structure',
    mimeType: 'text/markdown',
  })
  async getModuleDocs(params: { moduleName: string }): Promise<string> {
    const uri = `alaz://modules/${params.moduleName}`;
    this.mcpLogger.logResourceRead(uri, params);
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg =
      this.adapterRegistry.getUnsupportedMessage(framework);
    if (unsupportedMsg) {
      this.mcpLogger.logResourceResult(uri, unsupportedMsg.length);
      return unsupportedMsg;
    }
    const moduleRegistry = this.adapterRegistry.getModuleRegistry(framework)!;
    const docReader = this.adapterRegistry.getDocumentationReader(framework)!;
    const codebaseAnalyzer =
      this.adapterRegistry.getCodebaseAnalyzer(framework)!;
    const mod = await moduleRegistry.getModule(params.moduleName);
    if (!mod) {
      const notFoundMsg = `Module "${params.moduleName}" not found.`;
      this.mcpLogger.logResourceResult(uri, notFoundMsg.length);
      return notFoundMsg;
    }

    const doc = await docReader.getFeatureDoc(params.moduleName);
    const endpoints = await codebaseAnalyzer.getModuleEndpoints(
      params.moduleName,
    );

    const sections: string[] = [
      `# Module: ${mod.name}`,
      '',
      '## Structure',
      `- Path: \`${mod.path}\``,
      `- Subfolders: ${mod.subModules.join(', ') || '-'}`,
      `- Entities: ${mod.entityNames.join(', ') || 'None'}`,
      '',
    ];

    if (endpoints.length > 0) {
      sections.push('## Endpoints');
      sections.push('| Method | Path |');
      sections.push('|--------|------|');
      for (const ep of endpoints) {
        sections.push(`| ${ep.method} | ${ep.path} |`);
      }
      sections.push('');
    }

    if (doc) {
      sections.push('## Documentation');
      sections.push(doc);
    }

    const result = sections.join('\n');
    this.mcpLogger.logResourceResult(uri, result.length);
    return result;
  }
}
