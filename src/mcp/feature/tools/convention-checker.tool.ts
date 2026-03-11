import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { FileReaderService } from '@/mcp/util/data-access/services/file-reader.service';
import { ModuleRegistryService } from '@/mcp/data-access/services/module-registry.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

@Injectable()
export class ConventionCheckerTool {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly fileReader: FileReaderService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Tool({
    name: 'check-conventions',
    description:
      'Validates if a module follows projeto-X conventions (structure, naming, barrel exports)',
    parameters: z.object({
      moduleName: z.string().describe('Module name to validate'),
    }),
  })
  async checkConventions(params: { moduleName: string }): Promise<string> {
    this.mcpLogger.logToolInvoked('check-conventions', params);
    const mod = await this.moduleRegistry.getModule(params.moduleName);
    if (!mod) {
      const notFoundMsg = `Module "${params.moduleName}" not found.`;
      this.mcpLogger.logToolResult('check-conventions', notFoundMsg.length);
      return notFoundMsg;
    }

    const checks: {
      name: string;
      status: 'pass' | 'fail' | 'warning';
      msg: string;
    }[] = [];

    const hasDataAccess = await this.fileReader.exists(
      `${mod.path}/data-access`,
    );
    const hasDataAccessIndex = await this.fileReader.exists(
      `${mod.path}/data-access/index.ts`,
    );
    checks.push({
      name: 'data-access/ com index.ts',
      status: hasDataAccess && hasDataAccessIndex ? 'pass' : 'fail',
      msg:
        hasDataAccess && hasDataAccessIndex
          ? 'OK'
          : 'Missing data-access/ or barrel export',
    });

    const hasFeature = await this.fileReader.exists(`${mod.path}/feature`);
    const hasModuleFile =
      (await this.fileReader.readGlob(`${mod.path}/feature/*.module.ts`))
        .length > 0;
    checks.push({
      name: 'feature/ com *.module.ts',
      status: hasFeature && hasModuleFile ? 'pass' : 'fail',
      msg:
        hasFeature && hasModuleFile
          ? 'OK'
          : 'Missing feature/ or .module.ts file',
    });

    const controllerFiles = await this.fileReader.readGlob(
      `${mod.path}/**/*.controller.ts`,
    );
    let hasApiTags = true;
    for (const cf of controllerFiles) {
      const content = await this.fileReader.readFile(cf);
      if (content && !content.includes('@ApiTags')) hasApiTags = false;
    }
    checks.push({
      name: 'Controllers com @ApiTags',
      status:
        controllerFiles.length === 0 ? 'warning' : hasApiTags ? 'pass' : 'fail',
      msg:
        controllerFiles.length === 0
          ? 'No controllers'
          : hasApiTags
            ? 'OK'
            : 'Missing @ApiTags',
    });

    checks.push({
      name: 'Documentation',
      status: mod.hasDocumentation ? 'pass' : 'warning',
      msg: mod.hasDocumentation ? 'OK' : 'No doc in docs/features/',
    });

    checks.push({
      name: 'Testes',
      status: mod.hasTests || mod.hasE2eTests ? 'pass' : 'warning',
      msg: mod.hasTests || mod.hasE2eTests ? 'OK' : 'No tests',
    });

    const lines = [
      `# Conventions: ${mod.name}`,
      '',
      '| Check | Status |',
      '|-------|--------|',
    ];
    for (const c of checks) {
      const icon = c.status === 'pass' ? '✓' : c.status === 'fail' ? '✗' : '!';
      lines.push(`| ${c.name} | ${icon} ${c.msg} |`);
    }
    const result = lines.join('\n');
    this.mcpLogger.logToolResult('check-conventions', result.length);
    return result;
  }
}
