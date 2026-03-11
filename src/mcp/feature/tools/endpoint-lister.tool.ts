import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { CodebaseAnalyzerService } from '@/mcp/data-access/services/codebase-analyzer.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

@Injectable()
export class EndpointListerTool {
  constructor(
    private readonly codebaseAnalyzer: CodebaseAnalyzerService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Tool({
    name: 'list-endpoints',
    description: 'Lists API endpoints. Optionally filters by module.',
    parameters: z.object({
      moduleName: z
        .string()
        .optional()
        .describe('Filter by module (e.g. user, account)'),
    }),
  })
  async listEndpoints(params: { moduleName?: string }): Promise<string> {
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
  }
}
