import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { toReadResourceResult } from '@/mcp/core/util/read-resource-result.util';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';

@Injectable()
export class OnboardingResource {
  constructor(
    private readonly frameworkDetector: FrameworkDetectorService,
    private readonly adapterRegistry: FrameworkAdapterRegistryService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Resource({
    uri: 'alaz://onboarding',
    name: 'Onboarding',
    description: 'Aggregated onboarding guide for the project',
    mimeType: 'text/markdown',
  })
  async getOnboarding() {
    this.mcpLogger.logResourceRead('alaz://onboarding', {});
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg =
      this.adapterRegistry.getUnsupportedMessage(framework);
    if (unsupportedMsg) {
      this.mcpLogger.logResourceResult(
        'alaz://onboarding',
        unsupportedMsg.length,
      );
      return toReadResourceResult(
        'alaz://onboarding',
        'text/markdown',
        unsupportedMsg,
      );
    }
    const docReader = this.adapterRegistry.getDocumentationReader(framework)!;
    const moduleRegistry = this.adapterRegistry.getModuleRegistry(framework)!;
    const projectContext = this.adapterRegistry.getProjectContext(framework)!;
    const context = await projectContext.getContext();
    const readme = await docReader.getReadme();
    const overview = await docReader.getApiOverview();
    const modules = await moduleRegistry.listModules();

    const sections: string[] = [
      `# Onboarding — ${context.name}`,
      '',
      '## Stack',
      'NestJS 11, PostgreSQL (MikroORM/TypeORM/Objection), Redis, BullMQ, Passport, Zod/nestjs-zod, CQRS',
      '',
    ];

    if (readme) {
      sections.push('## README');
      sections.push(readme);
      sections.push('');
    }

    if (overview) {
      sections.push('## Architecture');
      sections.push(overview);
      sections.push('');
    }

    sections.push('## Modules');
    sections.push(`Total: ${modules.length}`);
    sections.push('');
    sections.push('| Module | Controller | Entities |');
    sections.push('|--------|------------|-----------|');
    for (const m of modules.slice(0, 20)) {
      sections.push(
        `| ${m.name} | ${m.hasController ? '✓' : '-'} | ${m.entityNames.length} |`,
      );
    }
    if (modules.length > 20) {
      sections.push(`| ... and ${modules.length - 20} more |`);
    }

    sections.push('');
    sections.push('## Executable Prompts (require developer confirmation)');
    sections.push(
      'Prompts `create-module`, `create-endpoint`, `update-documentation`, and `investigate-bug` return executable steps. The agent MUST ask the developer "Should I execute these changes?" and wait for explicit approval before proceeding. The output includes a confirmation header.',
    );
    sections.push('');
    sections.push('## Available Resources');
    sections.push('- `alaz://architecture` — Architecture overview');
    sections.push('- `alaz://conventions/api` — API conventions');
    sections.push('- `alaz://conventions/testing` — Testing patterns');
    sections.push('- `alaz://conventions/cqrs` — CQRS and Jobs');
    sections.push('- `alaz://authentication` — Auth and RBAC');
    sections.push('- `alaz://changelog` — Changelog');
    sections.push('- `alaz://modules/{moduleName}` — Module docs');
    sections.push('- `alaz://entities/{entityName}` — Entity schema');

    const result = sections.join('\n');
    this.mcpLogger.logResourceResult('alaz://onboarding', result.length);
    return toReadResourceResult('alaz://onboarding', 'text/markdown', result);
  }
}
