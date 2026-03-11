import { Injectable } from '@nestjs/common';
import { Prompt } from '@rekog/mcp-nest';
import { z } from 'zod';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';
import { withConfirmationRequirement } from '@/mcp/util/data-access/events/confirmation-prompt.event';

@Injectable()
export class NewModulePrompt {
  constructor(private readonly mcpLogger: McpLoggerService) {}

  @Prompt({
    name: 'create-module',
    description:
      'Template to create a module following projeto-X conventions. Output includes executable steps — agent MUST ask developer for confirmation before executing.',
    parameters: z.object({
      moduleName: z
        .string()
        .describe('Module name (e.g. billing, notification)'),
      hasController: z
        .boolean()
        .describe('Whether the module will have a controller'),
      hasEntity: z
        .boolean()
        .describe('Whether the module will have MikroORM entities'),
    }),
  })
  getPrompt(params: {
    moduleName: string;
    hasController: boolean;
    hasEntity: boolean;
  }): Promise<string> {
    this.mcpLogger.logPromptReceived('create-module', params);
    const { moduleName, hasController, hasEntity } = params;
    const sections: string[] = [
      `# Create module: ${moduleName}`,
      '',
      '## 1. Folder structure',
      'Follow the projeto-X domain-driven structure:',
      '```',
      `src/${moduleName}/`,
      '├── data-access/',
      '│   ├── services/',
      '│   └── index.ts',
      '├── feature/',
      '│   ├── ' + moduleName + '.module.ts',
      hasController ? `│   ├── ${moduleName}.controller.ts` : '',
      '│   └── index.ts',
      '└── util/',
      '    └── index.ts',
      '```',
      '',
      '## 2. Barrel exports',
      'Create `index.ts` in each subfolder exporting public items.',
      '',
    ];

    if (hasEntity) {
      sections.push(
        '## 3. Entity',
        'Create the entity in `data-access/` with:',
        '- `@Entity()` and optionally `tableName`',
        '- `@Property()` for each field',
        '- Use UUID as external identifier',
        '- Properties: uuid, createdAt, updatedAt per standard',
        '',
      );
    }

    if (hasController) {
      sections.push(
        '## 4. Controller',
        'Use the decorators:',
        "- `@ApiTags('" + moduleName + "')`",
        '- `@ApiBearerAuth()`',
        "- `@Controller('" + moduleName + "')`",
        '- `@Permissions(PermissionCode.*)` for protected endpoints',
        '- DTOs with `createZodDto` from nestjs-zod',
        '',
      );
    }

    sections.push(
      '## 5. Module',
      `Register ${moduleName}Module in AppModule.`,
      '',
      '## 6. Documentation',
      `Create docs/features/${moduleName.toUpperCase().replace(/-/g, '_')}.md and update docs/features/README.md`,
    );

    const result = withConfirmationRequirement(sections.join('\n'));
    this.mcpLogger.logPromptResult('create-module', result.length);
    return Promise.resolve(result);
  }
}
