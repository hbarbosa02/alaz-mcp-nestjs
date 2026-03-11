import { Injectable } from '@nestjs/common';
import { Prompt } from '@rekog/mcp-nest';
import { z } from 'zod';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';
import { withConfirmationRequirement } from '@/mcp/util/data-access/events/confirmation-prompt.event';

@Injectable()
export class UpdateDocsPrompt {
  constructor(private readonly mcpLogger: McpLoggerService) {}

  @Prompt({
    name: 'update-documentation',
    description:
      'Step-by-step guide to update module documentation. Output includes executable steps — agent MUST ask developer for confirmation before executing.',
    parameters: z.object({
      moduleName: z.string().describe('Name of the module that was changed'),
    }),
  })
  getPrompt(params: { moduleName: string }): Promise<string> {
    this.mcpLogger.logPromptReceived('update-documentation', params);
    const { moduleName } = params;
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
      '| Module | Doc file |',
      '|--------|----------|',
      '| account | docs/features/ACCOUNT.md |',
      '| audit-log | docs/features/AUDIT-LOG.md |',
      '| user, profile | docs/features/USER.md |',
      '| tenant | docs/features/TENANT.md |',
      '| permission, role | docs/features/PERMISSIONS.md |',
      '| ... | docs/features/<MODULE>.md |',
      '',
      '## 4. Update the doc',
      '- Keep existing format and style',
      '- If new endpoint: document method, path, description',
      '- If new entities: update docs/diagrams/DATABASE-ENTITIES.md',
      '',
      '## 5. Changelog',
      'Add entry to docs/changes/4 - Changelog.md (Keep a Changelog format).',
      '',
      '## 6. Cross-references',
      '- docs/features/README.md',
      '- docs/architecture/API-DOCUMENTATION.md (if new controller)',
      '- docs/diagrams/DATABASE-ENTITIES.md (if entities changed)',
    ].join('\n');

    const result = withConfirmationRequirement(content);
    this.mcpLogger.logPromptResult('update-documentation', result.length);
    return Promise.resolve(result);
  }
}
