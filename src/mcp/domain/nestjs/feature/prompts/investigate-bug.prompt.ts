import { Injectable } from '@nestjs/common';
import { Prompt } from '@rekog/mcp-nest';
import { z } from 'zod';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { withConfirmationRequirement } from '@/mcp/util/data-access/events/confirmation-prompt.event';

@Injectable()
export class InvestigateBugPrompt {
  constructor(private readonly mcpLogger: McpLoggerService) {}

  @Prompt({
    name: 'investigate-bug',
    description:
      'Guide to investigate a bug in an unknown module. Output includes executable steps — agent MUST ask developer for confirmation before executing.',
    parameters: z.object({
      moduleName: z.string().describe('Name of the affected module'),
      bugDescription: z.string().describe('Bug description'),
    }),
  })
  getPrompt(params: {
    moduleName: string;
    bugDescription: string;
  }): Promise<string> {
    this.mcpLogger.logPromptReceived('investigate-bug', params);
    const { moduleName, bugDescription } = params;
    const content = [
      `# Investigate bug in ${moduleName}`,
      '',
      `**Bug:** ${bugDescription}`,
      '',
      '## Recommended steps',
      '',
      '1. **Module structure**',
      `   - Consult \`alaz://modules/${moduleName}\` to understand the structure`,
      '',
      '2. **Involved entities**',
      '   - Use the `get-entity-schema` tool for the module entities',
      '',
      '3. **Existing tests**',
      '   - Use `get-test-summary` to see test coverage',
      '',
      '4. **Recent changes**',
      '   - Use `get-recent-changes` for recent commits in the module',
      '',
      '5. **Conventions**',
      '   - Consult `alaz://conventions/api` for expected patterns',
      '',
      '6. **Proposal**',
      '   - Based on the context, propose investigation and solution',
    ].join('\n');

    const result = withConfirmationRequirement(content);
    this.mcpLogger.logPromptResult('investigate-bug', result.length);
    return Promise.resolve(result);
  }
}
