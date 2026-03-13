import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NewModulePrompt } from '@/mcp/domain/nestjs/feature/prompts/new-module.prompt';
import { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { createProjectContext } from '../../helpers/mock-data';
import { EXECUTION_CONFIRMATION_HEADER } from '@/mcp/util/data-access/events/confirmation-prompt.event';

describe('NewModulePrompt', () => {
  let sut: NewModulePrompt;

  beforeEach(async () => {
    const projectContext = {
      getContext: jest.fn().mockResolvedValue(
        createProjectContext({
          docsLayout: { features: 'docs/features/' } as never,
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewModulePrompt,
        { provide: ProjectContextService, useValue: projectContext },
        {
          provide: McpLoggerService,
          useValue: {
            logPromptReceived: jest.fn(),
            logPromptResult: jest.fn(),
          },
        },
      ],
    }).compile();

    sut = module.get(NewModulePrompt);
  });

  it('should return prompt with confirmation header', async () => {
    const result = await sut.getPrompt({
      moduleName: 'billing',
      hasController: true,
      hasEntity: true,
    });

    expect(result).toContain(EXECUTION_CONFIRMATION_HEADER);
  });

  it('should include entity section when hasEntity is true', async () => {
    const result = await sut.getPrompt({
      moduleName: 'notification',
      hasController: false,
      hasEntity: true,
    });

    expect(result).toContain('## 3. Entity');
    expect(result).toContain('@Entity()');
  });

  it('should include controller section when hasController is true', async () => {
    const result = await sut.getPrompt({
      moduleName: 'billing',
      hasController: true,
      hasEntity: false,
    });

    expect(result).toContain('## 4. Controller');
    expect(result).toContain('@ApiTags');
    expect(result).toContain('billing.controller.ts');
  });

  it('should include folder structure with module name', async () => {
    const result = await sut.getPrompt({
      moduleName: 'my-module',
      hasController: true,
      hasEntity: true,
    });

    expect(result).toContain('src/my-module/');
    expect(result).toContain('my-module.module.ts');
  });
});
