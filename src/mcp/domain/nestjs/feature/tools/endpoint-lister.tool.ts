import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { CodebaseAnalyzerService } from '@/mcp/domain/nestjs/data-access/services/codebase-analyzer.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';

const projectRootParam = z
  .string()
  .optional()
  .describe('Path to NestJS project root. Overrides MCP config.');

@Injectable()
export class EndpointListerTool {
  constructor(
    private readonly codebaseAnalyzer: CodebaseAnalyzerService,
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
    const endpoints = await this.codebaseAnalyzer.getEndpoints(
      params.moduleName,
    );

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
