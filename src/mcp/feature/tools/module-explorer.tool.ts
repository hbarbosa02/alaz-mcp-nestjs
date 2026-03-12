import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { CodebaseAnalyzerService } from '@/mcp/data-access/services/codebase-analyzer.service';
import { DocumentationReaderService } from '@/mcp/data-access/services/documentation-reader.service';
import { ModuleRegistryService } from '@/mcp/data-access/services/module-registry.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

@Injectable()
export class ModuleExplorerTool {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly docReader: DocumentationReaderService,
    private readonly codebaseAnalyzer: CodebaseAnalyzerService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Tool({
    name: 'list-modules',
    description:
      'Lists all project modules with paths, controllers, entities and documentation',
    parameters: z.object({}),
  })
  async listModules(): Promise<string> {
    this.mcpLogger.logToolInvoked('list-modules', {});
    const modules = await this.moduleRegistry.listModules();
    const lines = [
      '| Module | Controller | Entities | Tests | Docs |',
      '|--------|------------|-----------|--------|------|',
    ];
    for (const m of modules) {
      lines.push(
        `| ${m.name} | ${m.hasController ? '✓' : '-'} | ${m.entityNames.length} | ${m.hasTests || m.hasE2eTests ? '✓' : '-'} | ${m.hasDocumentation ? '✓' : '-'} |`,
      );
    }
    const result = lines.join('\n');
    this.mcpLogger.logToolResult('list-modules', result.length);
    return result;
  }

  @Tool({
    name: 'get-module-detail',
    description:
      'Returns full module details: structure, entities, endpoints, tests',
    parameters: z.object({
      moduleName: z
        .string()
        .describe('Module name (e.g. user, account, tenant)'),
    }),
  })
  async getModuleDetail(params: { moduleName: string }): Promise<string> {
    this.mcpLogger.logToolInvoked('get-module-detail', params);
    const mod = await this.moduleRegistry.getModule(params.moduleName);
    if (!mod) {
      const notFoundMsg = `Module "${params.moduleName}" not found. Use list-modules to see available modules.`;
      this.mcpLogger.logToolResult('get-module-detail', notFoundMsg.length);
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
      `- Controller: ${mod.hasController ? 'Yes' : 'No'}`,
      `- Entities: ${mod.entityNames.join(', ') || 'None'}`,
      `- Tests: ${mod.hasTests ? 'Unit' : ''} ${mod.hasE2eTests ? 'E2E' : ''}`.trim() ||
        'None',
      '',
    ];

    if (endpoints.length > 0) {
      sections.push('## Endpoints');
      sections.push(
        '| Method | Path | Permissions |',
        '|--------|------|-------------|',
      );
      for (const ep of endpoints) {
        sections.push(
          `| ${ep.method} | ${ep.path} | ${ep.permissions.join(', ') || '-'} |`,
        );
      }
      sections.push('');
    }

    if (doc) {
      sections.push('## Documentation');
      sections.push(doc);
    }

    const result = sections.join('\n');
    this.mcpLogger.logToolResult('get-module-detail', result.length);
    return result;
  }
}
