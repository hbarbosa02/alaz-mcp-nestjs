import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { requireAdapter } from '@/mcp/util/require-adapter.util';

const projectRootParam = z
  .string()
  .optional()
  .describe('Path to NestJS project root. Overrides MCP config.');

@Injectable()
export class EndpointListerTool {
  constructor(
    private readonly frameworkDetector: FrameworkDetectorService,
    private readonly adapterRegistry: FrameworkAdapterRegistryService,
    private readonly mcpLogger: McpLoggerService,
    private readonly projectRootContext: ProjectRootContextService,
  ) {}

  @Tool({
    name: 'list-endpoints',
    description: 'Lists API endpoints. Optionally filters by module.',
    parameters: z.object({
      moduleName: z
        .string()
        .optional()
        .describe('Filter by module (e.g. user, account)'),
      projectRoot: projectRootParam,
    }),
  })
  async listEndpoints(params: {
    moduleName?: string;
    projectRoot?: string;
  }): Promise<string> {
    const doWork = async () => {
      this.mcpLogger.logToolInvoked('list-endpoints', params);
      const framework = await this.frameworkDetector.detect();
      const unsupportedMsg =
        this.adapterRegistry.getUnsupportedMessage(framework);

      if (unsupportedMsg) {
        this.mcpLogger.logToolResult('list-endpoints', unsupportedMsg.length);
        return unsupportedMsg;
      }
      const codebaseAnalyzer = requireAdapter(
        this.adapterRegistry.getCodebaseAnalyzer(framework),
        'CodebaseAnalyzer',
        framework,
      );
      const endpoints = await codebaseAnalyzer.getEndpoints(params.moduleName);

      const lines = [
        '| Method | Path | Controller | Permissions | Auth |',
        '|--------|------|------------|-------------|------|',
      ];
      for (const ep of endpoints) {
        lines.push(
          `| ${ep.method} | ${ep.path} | ${ep.controllerClass} | ${ep.permissions.join(', ') || '-'} | ${ep.authType} |`,
        );
      }
      const result = lines.join('\n');
      this.mcpLogger.logToolResult('list-endpoints', result.length);
      return result;
    };
    if (params.projectRoot) {
      return this.projectRootContext.run(params.projectRoot, doWork);
    }
    return doWork();
  }
}
