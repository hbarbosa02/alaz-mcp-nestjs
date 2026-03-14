import { Injectable } from '@nestjs/common';
import { ResourceTemplate } from '@rekog/mcp-nest';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { toReadResourceResult } from '@/mcp/core/util/read-resource-result.util';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { requireAdapter } from '@/mcp/util/require-adapter.util';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';

@Injectable()
export class ModuleEndpointsResource {
  constructor(
    private readonly frameworkDetector: FrameworkDetectorService,
    private readonly adapterRegistry: FrameworkAdapterRegistryService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @ResourceTemplate({
    uriTemplate: 'alaz://modules/{moduleName}/endpoints',
    name: 'Module Endpoints',
    description: 'Module endpoints',
    mimeType: 'text/markdown',
  })
  async getModuleEndpoints(params: { moduleName: string }) {
    const uri = `alaz://modules/${params.moduleName}/endpoints`;
    this.mcpLogger.logResourceRead(uri, params);
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg =
      this.adapterRegistry.getUnsupportedMessage(framework);

    if (unsupportedMsg) {
      this.mcpLogger.logResourceResult(uri, unsupportedMsg.length);
      return toReadResourceResult(uri, 'text/markdown', unsupportedMsg);
    }
    const moduleRegistry = requireAdapter(
      this.adapterRegistry.getModuleRegistry(framework),
      'ModuleRegistry',
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

    const endpoints = await codebaseAnalyzer.getModuleEndpoints(
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
    return toReadResourceResult(uri, 'text/markdown', result);
  }
}
