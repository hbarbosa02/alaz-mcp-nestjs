import { Injectable } from '@nestjs/common';
import { Prompt } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ProjectContextService } from '@/mcp/data-access/services/project-context.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';
import { withConfirmationRequirement } from '@/mcp/util/data-access/events/confirmation-prompt.event';

@Injectable()
export class NewEndpointPrompt {
  constructor(
    private readonly projectContext: ProjectContextService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Prompt({
    name: 'create-endpoint',
    description:
      'Template to add endpoint with Swagger, Zod DTO, permissions. Output includes executable steps — agent MUST ask developer for confirmation before executing.',
    parameters: z.object({
      moduleName: z.string().describe('Module name'),
      httpMethod: z
        .enum(['GET', 'POST', 'PATCH', 'DELETE'])
        .describe('HTTP method'),
      description: z.string().describe('Endpoint description'),
    }),
  })
  async getPrompt(params: {
    moduleName: string;
    httpMethod: string;
    description: string;
  }): Promise<string> {
    this.mcpLogger.logPromptReceived('create-endpoint', params);
    const { moduleName, httpMethod, description } = params;
    const context = await this.projectContext.getContext();

    const errorSection = context.customExceptionClass
      ? `Use \`${context.customExceptionClass}\` instead of generic HttpException.`
      : 'Use the project custom HttpException if available, otherwise HttpException.';

    const sections: string[] = [
      `# Add endpoint ${httpMethod} in ${moduleName}`,
      '',
      `Description: ${description}`,
      '',
      '## 1. DTO (if needed)',
      'Create the Zod schema and class with `createZodDto`:',
      '```typescript',
      'const schema = z.object({ ... });',
      'export class CreateXxxBodyDto extends createZodDto(schema) {}',
      '```',
      '',
      '## 2. Controller',
      `Add the method to ${moduleName}Controller:`,
      '```typescript',
      `@${httpMethod}('path')`,
      '@Permissions(PermissionCode.ManageXxx)  // if protected',
      'async methodName(@Body() body: XxxDto) { ... }',
      '```',
      '',
      '## 3. If GET list (paginated)',
      '- Use `PaginationInterceptor` + `ApiResponsePresenter`',
      '- Query params: pageNumber, pageSize, where, orderBy',
      '',
      '## 4. Errors',
      errorSection,
      '',
      '## 5. Documentation',
      'Update docs/features/ with the new endpoint.',
    ];

    const result = withConfirmationRequirement(sections.join('\n'));
    this.mcpLogger.logPromptResult('create-endpoint', result.length);
    return result;
  }
}
