import { Injectable } from '@nestjs/common';
import { Prompt } from '@rekog/mcp-nest';
import { z } from 'zod';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

@Injectable()
export class CodeReviewPrompt {
  constructor(private readonly mcpLogger: McpLoggerService) {}

  @Prompt({
    name: 'code-review-checklist',
    description: 'Review checklist based on project conventions',
    parameters: z.object({
      moduleName: z.string().describe('Name of the module to review'),
    }),
  })
  getPrompt(params: { moduleName: string }): Promise<string> {
    this.mcpLogger.logPromptReceived('code-review-checklist', params);
    const { moduleName } = params;
    const result = [
      `# Code Review Checklist: ${moduleName}`,
      '',
      'Use the `check-conventions` tool to validate the structure. Additionally:',
      '',
      '## Structure',
      '- [ ] data-access/, feature/, util/ present as needed',
      '- [ ] Barrel exports (index.ts) in each subfolder',
      '',
      '## Controllers',
      '- [ ] Controllers are thin (delegate to services)',
      '- [ ] @ApiTags, @ApiBearerAuth presentes',
      '- [ ] @Permissions() on protected endpoints',
      '- [ ] DTOs with createZodDto (no inline ZodValidationPipe)',
      '',
      '## Errors',
      '- [ ] ProjetoXHttpException instead of HttpException',
      '',
      '## Entities',
      '- [ ] UUID as external identifier',
      '- [ ] @Entity, @Property with correct options',
      '',
      '## Tests',
      '- [ ] Tests exist (*.spec.ts, *.e2e-spec.ts)',
      '- [ ] Follow AAA, use sut, factories',
      '- [ ] In-memory repos for unit tests',
      '',
      '## Documentation',
      '- [ ] docs/features/ updated',
      '- [ ] Changelog updated',
    ].join('\n');
    this.mcpLogger.logPromptResult('code-review-checklist', result.length);
    return Promise.resolve(result);
  }
}
