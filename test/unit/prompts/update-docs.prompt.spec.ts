import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { UpdateDocsPrompt } from '@/mcp/domain/nestjs/feature/prompts/update-docs.prompt';
import { ModuleRegistryService } from '@/mcp/domain/nestjs/data-access/services/module-registry.service';
import { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { createModuleInfo, createProjectContext } from '../../helpers/mock-data';
import { EXECUTION_CONFIRMATION_HEADER } from '@/mcp/util/data-access/events/confirmation-prompt.event';

describe('UpdateDocsPrompt', () => {
  let sut: UpdateDocsPrompt;

  beforeEach(async () => {
    const moduleRegistry = {
      listModules: jest.fn().mockResolvedValue([
        createModuleInfo({ name: 'account', documentationPath: 'docs/features/ACCOUNT.md' }),
      ]),
    };

    const projectContext = {
      getContext: jest.fn().mockResolvedValue(
        createProjectContext({
          docsLayout: {
            features: 'docs/features/',
            architecture: 'docs/architecture/',
            changelog: 'docs/changes/4 - Changelog.md',
            conventions: 'docs/api/API-CONVENTIONS.md',
            testing: 'docs/tests/README-TESTS.md',
            entities: 'docs/diagrams/DATABASE-ENTITIES.md',
            apiOverview: 'docs/architecture/API-OVERVIEW.md',
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateDocsPrompt,
        { provide: ModuleRegistryService, useValue: moduleRegistry },
        { provide: ProjectContextService, useValue: projectContext },
        { provide: McpLoggerService, useValue: { logPromptReceived: jest.fn(), logPromptResult: jest.fn() } },
      ],
    }).compile();

    sut = module.get(UpdateDocsPrompt);
  });

  it('should return prompt with confirmation header', async () => {
    const result = await sut.getPrompt({ moduleName: 'user' });

    expect(result).toContain(EXECUTION_CONFIRMATION_HEADER);
  });

  it('should include module name in content', async () => {
    const result = await sut.getPrompt({ moduleName: 'tenant' });

    expect(result).toContain('# Update documentation: tenant');
    expect(result).toContain('alaz://modules/tenant');
  });

  it('should include mapping table and steps', async () => {
    const result = await sut.getPrompt({ moduleName: 'account' });

    expect(result).toContain('## 1. Check current state');
    expect(result).toContain('## 3. Module -> doc mapping');
    expect(result).toContain('docs/features/ACCOUNT.md');
    expect(result).toContain('## 5. Changelog');
    expect(result).toContain('docs/changes/4 - Changelog.md');
  });
});
