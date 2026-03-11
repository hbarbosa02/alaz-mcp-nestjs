import { Injectable } from '@nestjs/common';
import { ResourceTemplate } from '@rekog/mcp-nest';
import { CodebaseAnalyzerService } from '@/mcp/data-access/services/codebase-analyzer.service';
import { DocumentationReaderService } from '@/mcp/data-access/services/documentation-reader.service';
import { ModuleRegistryService } from '@/mcp/data-access/services/module-registry.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

@Injectable()
export class ModuleDocsResource {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly docReader: DocumentationReaderService,
    private readonly codebaseAnalyzer: CodebaseAnalyzerService,
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
    const mod = await this.moduleRegistry.getModule(params.moduleName);
    if (!mod) {
      const notFoundMsg = `Module "${params.moduleName}" not found.`;
      this.mcpLogger.logResourceResult(uri, notFoundMsg.length);
      return notFoundMsg;
    }

    const doc = await this.docReader.getFeatureDoc(params.moduleName);
    const endpoints = await this.codebaseAnalyzer.getModuleEndpoints(
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
