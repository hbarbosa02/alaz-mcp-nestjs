import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CodeReviewPrompt } from '@/mcp/domain/nestjs/feature/prompts/code-review.prompt';
import { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { createProjectContext } from '../../helpers/mock-data';
import { EXECUTION_CONFIRMATION_HEADER } from '@/mcp/util/data-access/events/confirmation-prompt.event';

describe('CodeReviewPrompt', () => {
  let sut: CodeReviewPrompt;

  beforeEach(async () => {
    const projectContext = {
      getContext: jest.fn().mockResolvedValue(createProjectContext()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodeReviewPrompt,
        { provide: ProjectContextService, useValue: projectContext },
        { provide: McpLoggerService, useValue: { logPromptReceived: jest.fn(), logPromptResult: jest.fn() } },
      ],
    }).compile();

    sut = module.get(CodeReviewPrompt);
  });

  it('should not use confirmation header', async () => {
    const result = await sut.getPrompt({ moduleName: 'user' });

    expect(result).not.toContain(EXECUTION_CONFIRMATION_HEADER);
  });

  it('should include module name and checklist sections', async () => {
    const result = await sut.getPrompt({ moduleName: 'tenant' });

    expect(result).toContain('# Code Review Checklist: tenant');
    expect(result).toContain('check-conventions');
    expect(result).toContain('## Structure');
    expect(result).toContain('## Controllers');
    expect(result).toContain('## Errors');
    expect(result).toContain('## Entities');
    expect(result).toContain('## Tests');
    expect(result).toContain('## Documentation');
  });
});
