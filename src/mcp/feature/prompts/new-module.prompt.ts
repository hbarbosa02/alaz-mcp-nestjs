import { Injectable } from '@nestjs/common';
import { Prompt } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ProjectContextService } from '@/mcp/data-access/services/project-context.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';
import { withConfirmationRequirement } from '@/mcp/util/data-access/events/confirmation-prompt.event';

@Injectable()
export class NewModulePrompt {
  constructor(
    private readonly projectContext: ProjectContextService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Prompt({
    name: 'create-module',
    description:
      'Template to create a module following project conventions. Output includes executable steps — agent MUST ask developer for confirmation before executing.',
    parameters: z.object({
      moduleName: z
        .string()
        .describe('Module name (e.g. billing, notification)'),
      hasController: z
        .boolean()
        .describe('Whether the module will have a controller'),
      hasEntity: z
        .boolean()
        .describe(
          'Whether the module will have entities (MikroORM, TypeORM, or Objection)',
        ),
    }),
  })
  async getPrompt(params: {
    moduleName: string;
    hasController: boolean;
    hasEntity: boolean;
  }): Promise<string> {
    this.mcpLogger.logPromptReceived('create-module', params);
    const { moduleName, hasController, hasEntity } = params;
    const context = await this.projectContext.getContext();

    const structureSection =
      context.modulePattern === 'domain-driven'
        ? [
            'Follow the domain-driven structure:',
            '```',
            `src/${moduleName}/`,
            '├── data-access/',
            '│   ├── services/',
            '│   └── index.ts',
            '├── feature/',
            '│   ├── ' + moduleName + '.module.ts',
            ...(hasController ? [`│   ├── ${moduleName}.controller.ts`] : []),
            '│   └── index.ts',
            '└── util/',
            '    └── index.ts',
            '```',
          ]
        : [
            'Follow the flat module structure:',
            '```',
            `src/${moduleName}/`,
            '├── ' + moduleName + '.module.ts',
            ...(hasController ? [`├── ${moduleName}.controller.ts`] : []),
            '├── ' + moduleName + '.service.ts',
            '└── index.ts',
            '```',
          ];

    const sections: string[] = [
      `# Create module: ${moduleName}`,
      '',
      '## 1. Folder structure',
      ...structureSection,
      '',
      '## 2. Barrel exports',
      'Create `index.ts` exporting public items.',
      '',
    ];

    if (hasEntity) {
      sections.push(
        '## 3. Entity',
        'Create the entity in `data-access/` (or module root) with:',
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

    const docsPath = context.docsLayout.features
      ? `${context.docsLayout.features}${moduleName.toUpperCase().replace(/-/g, '_')}.md`
      : `docs/features/${moduleName.toUpperCase().replace(/-/g, '_')}.md`;

    sections.push(
      '## 5. Module',
      `Register ${moduleName}Module in AppModule.`,
      '',
      '## 6. Documentation',
      `Create ${docsPath} and update the docs index.`,
    );

    const result = withConfirmationRequirement(sections.join('\n'));
    this.mcpLogger.logPromptResult('create-module', result.length);
    return result;
  }
}
