import { Injectable } from '@nestjs/common';
import { Prompt } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ModuleRegistryService } from '@/mcp/domain/nestjs/data-access/services/module-registry.service';
import { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { withConfirmationRequirement } from '@/mcp/util/data-access/events/confirmation-prompt.event';

@Injectable()
export class UpdateDocsPrompt {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly projectContext: ProjectContextService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Prompt({
    name: 'update-documentation',
    description:
      'Step-by-step guide to update module documentation. Output includes executable steps — agent MUST ask developer for confirmation before executing.',
    parameters: z.object({
      moduleName: z.string().describe('Name of the module that was changed'),
    }),
  })
  async getPrompt(params: { moduleName: string }): Promise<string> {
    this.mcpLogger.logPromptReceived('update-documentation', params);
    const { moduleName } = params;
    const context = await this.projectContext.getContext();
    const modules = await this.moduleRegistry.listModules();

    const moduleTableLines = [
      '| Module | Doc file |',
      '|--------|----------|',
      ...modules
        .filter((m) => m.documentationPath)
        .slice(0, 15)
        .map((m) => `| ${m.name} | ${m.documentationPath ?? '—'} |`),
    ];
    if (modules.length > 15) {
      moduleTableLines.push(`| ... | docs/features/<MODULE>.md |`);
    } else {
      moduleTableLines.push('| ... | docs/features/<MODULE>.md |');
    }

    const changelogPath =
      context.docsLayout.changelog ?? 'docs/changes/4 - Changelog.md';
    const entitiesPath =
      context.docsLayout.entities ?? 'docs/diagrams/DATABASE-ENTITIES.md';

    const content = [
      `# Update documentation: ${moduleName}`,
      '',
      '## 1. Check current state',
      `Use the resource \`alaz://modules/${moduleName}\` to understand the current structure.`,
      '',
      '## 2. Read the code',
      'Verify changes in the module source code (git diff if possible).',
      '',
      '## 3. Module -> doc mapping',
      ...moduleTableLines,
      '',
      '## 4. Update the doc',
      '- Keep existing format and style',
      '- If new endpoint: document method, path, description',
      `- If new entities: update ${entitiesPath}`,
      '',
      '## 5. Changelog',
      `Add entry to ${changelogPath} (Keep a Changelog format).`,
      '',
      '## 6. Cross-references',
      '- docs/features/README.md',
      '- docs/architecture/API-DOCUMENTATION.md (if new controller)',
      `- ${entitiesPath} (if entities changed)`,
    ].join('\n');

    const result = withConfirmationRequirement(content);
    this.mcpLogger.logPromptResult('update-documentation', result.length);
    return result;
  }
}
