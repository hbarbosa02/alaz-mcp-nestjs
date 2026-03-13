import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';

const projectRootParam = z
  .string()
  .optional()
  .describe('Path to NestJS project root. Overrides MCP config.');

@Injectable()
export class ModuleExplorerTool {
  constructor(
    private readonly frameworkDetector: FrameworkDetectorService,
    private readonly adapterRegistry: FrameworkAdapterRegistryService,
    private readonly mcpLogger: McpLoggerService,
    private readonly projectRootContext: ProjectRootContextService,
  ) {}

  @Tool({
    name: 'list-modules',
    description:
      'Lists all project modules with paths, controllers, entities and documentation',
    parameters: z.object({ projectRoot: projectRootParam }),
  })
  async listModules(params: { projectRoot?: string } = {}): Promise<string> {
    const doWork = async () => {
    this.mcpLogger.logToolInvoked('list-modules', params);
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg = this.adapterRegistry.getUnsupportedMessage(framework);
    if (unsupportedMsg) {
      this.mcpLogger.logToolResult('list-modules', unsupportedMsg.length);
      return unsupportedMsg;
    }
    const moduleRegistry = this.adapterRegistry.getModuleRegistry(framework)!;
    const docReader = this.adapterRegistry.getDocumentationReader(framework)!;
    const codebaseAnalyzer = this.adapterRegistry.getCodebaseAnalyzer(framework)!;
    const modules = await moduleRegistry.listModules();
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
    };
    if (params.projectRoot) {
      return this.projectRootContext.run(params.projectRoot, doWork);
    }
    return doWork();
  }

  @Tool({
    name: 'get-module-detail',
    description:
      'Returns full module details: structure, entities, endpoints, tests',
    parameters: z.object({
      moduleName: z
        .string()
        .describe('Module name (e.g. user, account, tenant)'),
      projectRoot: projectRootParam,
    }),
  })
  async getModuleDetail(params: {
    moduleName: string;
    projectRoot?: string;
  }): Promise<string> {
    const doWork = async () => {
    this.mcpLogger.logToolInvoked('get-module-detail', params);
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg = this.adapterRegistry.getUnsupportedMessage(framework);
    if (unsupportedMsg) {
      this.mcpLogger.logToolResult('get-module-detail', unsupportedMsg.length);
      return unsupportedMsg;
    }
    const moduleRegistry = this.adapterRegistry.getModuleRegistry(framework)!;
    const docReader = this.adapterRegistry.getDocumentationReader(framework)!;
    const codebaseAnalyzer = this.adapterRegistry.getCodebaseAnalyzer(framework)!;
    const mod = await moduleRegistry.getModule(params.moduleName);
    if (!mod) {
      const notFoundMsg = `Module "${params.moduleName}" not found. Use list-modules to see available modules.`;
      this.mcpLogger.logToolResult('get-module-detail', notFoundMsg.length);
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
    };
    if (params.projectRoot) {
      return this.projectRootContext.run(params.projectRoot, doWork);
    }
    return doWork();
  }
}
