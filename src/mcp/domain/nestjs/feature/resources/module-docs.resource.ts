import { Injectable } from '@nestjs/common';
import { ResourceTemplate } from '@rekog/mcp-nest';
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { toReadResourceResult } from '@/mcp/core/util/read-resource-result.util';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { requireAdapter } from '@/mcp/util/require-adapter.util';
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
  async getModuleDocs(params: { moduleName: string }): Promise<ReadResourceResult> {
    const uri = `alaz://modules/${params.moduleName}`;
    this.mcpLogger.logResourceRead(uri, params);
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg = this.adapterRegistry.getUnsupportedMessage(framework);

    if (unsupportedMsg) {
      this.mcpLogger.logResourceResult(uri, unsupportedMsg.length);
      return toReadResourceResult(uri, 'text/markdown', unsupportedMsg);
    }
    const moduleRegistry = requireAdapter(
      this.adapterRegistry.getModuleRegistry(framework),
      'ModuleRegistry',
      framework,
    );
    const docReader = requireAdapter(
      this.adapterRegistry.getDocumentationReader(framework),
      'DocumentationReader',
      framework,
    );
    const codebaseAnalyzer = requireAdapter(
      this.adapterRegistry.getCodebaseAnalyzer(framework),
      'CodebaseAnalyzer',
      framework,
    );
    const mod = await moduleRegistry.getModule(params.moduleName);

    if (!mod) {
      const moduleNotFoundMessage = `Module "${params.moduleName}" not found.`;
      this.mcpLogger.logResourceResult(uri, moduleNotFoundMessage.length);
      return toReadResourceResult(uri, 'text/markdown', moduleNotFoundMessage);
    }

    const doc = await docReader.getFeatureDoc(params.moduleName);
    const endpoints = await codebaseAnalyzer.getModuleEndpoints(params.moduleName);

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
    return toReadResourceResult(uri, 'text/markdown', result);
  }
}
