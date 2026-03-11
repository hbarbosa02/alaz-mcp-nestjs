import { Injectable } from '@nestjs/common';
import { ResourceTemplate } from '@rekog/mcp-nest';
import { CodebaseAnalyzerService } from '@/mcp/data-access/services/codebase-analyzer.service';
import { ModuleRegistryService } from '@/mcp/data-access/services/module-registry.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

@Injectable()
export class ModuleEndpointsResource {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly codebaseAnalyzer: CodebaseAnalyzerService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @ResourceTemplate({
    uriTemplate: 'alaz://modules/{moduleName}/endpoints',
    name: 'Module Endpoints',
    description: 'Module endpoints',
    mimeType: 'text/markdown',
  })
  async getModuleEndpoints(params: { moduleName: string }): Promise<string> {
    const uri = `alaz://modules/${params.moduleName}/endpoints`;
    this.mcpLogger.logResourceRead(uri, params);
    const mod = await this.moduleRegistry.getModule(params.moduleName);
    if (!mod) {
      const notFoundMsg = `Module "${params.moduleName}" not found.`;
      this.mcpLogger.logResourceResult(uri, notFoundMsg.length);
      return notFoundMsg;
    }

    const endpoints = await this.codebaseAnalyzer.getModuleEndpoints(
      params.moduleName,
    );

    const lines = [
      `# Endpoints: ${params.moduleName}`,
      '',
      '| Method | Path | Permissions | Auth |',
      '|--------|------|-------------|------|',
    ];
    for (const ep of endpoints) {
      lines.push(
        `| ${ep.method} | ${ep.path} | ${ep.permissions.join(', ') || '-'} | ${ep.authType} |`,
      );
    }
    const result = lines.join('\n');
    this.mcpLogger.logResourceResult(uri, result.length);
    return result;
  }
}
