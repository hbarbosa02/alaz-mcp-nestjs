import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { FileReaderService } from '@/mcp/util/data-access/services/file-reader.service';
import { ModuleRegistryService } from '@/mcp/data-access/services/module-registry.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

@Injectable()
export class TestInfoTool {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly fileReader: FileReaderService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Tool({
    name: 'get-test-summary',
    description:
      'Test summary for project or module: unit, e2e, factories, in-memory repos',
    parameters: z.object({
      moduleName: z.string().optional().describe('Filter by module'),
    }),
  })
  async getTestSummary(params: { moduleName?: string }): Promise<string> {
    this.mcpLogger.logToolInvoked('get-test-summary', params);
    if (params.moduleName) {
      const mod = await this.moduleRegistry.getModule(params.moduleName);
      if (!mod) {
        const notFoundMsg = `Module "${params.moduleName}" not found.`;
        this.mcpLogger.logToolResult('get-test-summary', notFoundMsg.length);
        return notFoundMsg;
      }
      const specFiles = await this.fileReader.readGlob(
        `src/${params.moduleName}/**/*.spec.ts`,
      );
      const e2eFiles = await this.fileReader.readGlob(
        `src/${params.moduleName}/**/*.e2e-spec.ts`,
      );
      const hasFactories = await this.fileReader.exists('test/factories');
      const hasInMemoryRepos =
        await this.fileReader.exists('test/repositories');

      const result = [
        `# Testes: ${params.moduleName}`,
        '',
        `- Unit tests: ${specFiles.length}`,
        `- E2E tests: ${e2eFiles.length}`,
        `- Factories: ${hasFactories ? 'Yes' : 'No'}`,
        `- In-memory repos: ${hasInMemoryRepos ? 'Yes' : 'No'}`,
        '',
        'Test files:',
        ...specFiles.map((f) => `- ${f}`),
        ...e2eFiles.map((f) => `- ${f}`),
      ].join('\n');
      this.mcpLogger.logToolResult('get-test-summary', result.length);
      return result;
    }

    const modules = await this.moduleRegistry.listModules();
    let totalSpec = 0;
    let totalE2e = 0;
    for (const m of modules) {
      const spec = await this.fileReader.readGlob(`src/${m.name}/**/*.spec.ts`);
      const e2e = await this.fileReader.readGlob(
        `src/${m.name}/**/*.e2e-spec.ts`,
      );
      totalSpec += spec.length;
      totalE2e += e2e.length;
    }
    const hasFactories = await this.fileReader.exists('test/factories');
    const hasInMemoryRepos = await this.fileReader.exists('test/repositories');

    const result = [
      '# Test Summary (project)',
      '',
      `- Unit tests: ${totalSpec}`,
      `- E2E tests: ${totalE2e}`,
      `- Factories: ${hasFactories ? 'Yes' : 'No'}`,
      `- In-memory repos: ${hasInMemoryRepos ? 'Yes' : 'No'}`,
    ].join('\n');
    this.mcpLogger.logToolResult('get-test-summary', result.length);
    return result;
  }
}
