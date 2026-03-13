import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';

const projectRootParam = z
  .string()
  .optional()
  .describe('Path to NestJS project root. Overrides MCP config.');

@Injectable()
export class ConventionCheckerTool {
  constructor(
    private readonly frameworkDetector: FrameworkDetectorService,
    private readonly adapterRegistry: FrameworkAdapterRegistryService,
    private readonly fileReader: FileReaderService,
    private readonly mcpLogger: McpLoggerService,
    private readonly projectRootContext: ProjectRootContextService,
  ) {}

  @Tool({
    name: 'check-conventions',
    description:
      'Validates if a module follows project conventions (structure, naming, barrel exports)',
    parameters: z.object({
      moduleName: z.string().describe('Module name to validate'),
      projectRoot: projectRootParam,
    }),
  })
  async checkConventions(params: {
    moduleName: string;
    projectRoot?: string;
  }): Promise<string> {
    const doWork = async () => {
      this.mcpLogger.logToolInvoked('check-conventions', params);
      const framework = await this.frameworkDetector.detect();
      const unsupportedMsg =
        this.adapterRegistry.getUnsupportedMessage(framework);
      if (unsupportedMsg) {
        this.mcpLogger.logToolResult(
          'check-conventions',
          unsupportedMsg.length,
        );
        return unsupportedMsg;
      }
      const moduleRegistry = this.adapterRegistry.getModuleRegistry(framework)!;
      const projectContext = this.adapterRegistry.getProjectContext(framework)!;
      const mod = await moduleRegistry.getModule(params.moduleName);
      if (!mod) {
        const notFoundMsg = `Module "${params.moduleName}" not found.`;
        this.mcpLogger.logToolResult('check-conventions', notFoundMsg.length);
        return notFoundMsg;
      }

      const context = await projectContext.getContext();
      const checks: {
        name: string;
        status: 'pass' | 'fail' | 'warning';
        msg: string;
      }[] = [];

      if (context.modulePattern === 'domain-driven') {
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
      } else {
        const hasModuleFile =
          (await this.fileReader.readGlob(`${mod.path}/**/*.module.ts`))
            .length > 0;
        checks.push({
          name: '*.module.ts present',
          status: hasModuleFile ? 'pass' : 'fail',
          msg: hasModuleFile ? 'OK' : 'Missing .module.ts file',
        });
      }

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
          controllerFiles.length === 0
            ? 'warning'
            : hasApiTags
              ? 'pass'
              : 'fail',
        msg:
          controllerFiles.length === 0
            ? 'No controllers'
            : hasApiTags
              ? 'OK'
              : 'Missing @ApiTags',
      });

      const docMsg = context.docsLayout.features
        ? 'No doc in docs/features/'
        : 'No documentation found';
      checks.push({
        name: 'Documentation',
        status: mod.hasDocumentation ? 'pass' : 'warning',
        msg: mod.hasDocumentation ? 'OK' : docMsg,
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
        const icon =
          c.status === 'pass' ? '✓' : c.status === 'fail' ? '✗' : '!';
        lines.push(`| ${c.name} | ${icon} ${c.msg} |`);
      }
      const result = lines.join('\n');
      this.mcpLogger.logToolResult('check-conventions', result.length);
      return result;
    };
    if (params.projectRoot) {
      return this.projectRootContext.run(params.projectRoot, doWork);
    }
    return doWork();
  }
}
