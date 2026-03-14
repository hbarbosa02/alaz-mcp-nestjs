import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NewEndpointPrompt } from '@/mcp/domain/nestjs/feature/prompts/new-endpoint.prompt';
import { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { createProjectContext } from '@test/helpers/mock-data';
import { EXECUTION_CONFIRMATION_HEADER } from '@/mcp/util/data-access/events/confirmation-prompt.event';

describe('NewEndpointPrompt', () => {
  let sut: NewEndpointPrompt;

  beforeEach(async () => {
    const projectContext = {
      getContext: jest.fn().mockResolvedValue(createProjectContext()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewEndpointPrompt,
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

    sut = module.get(NewEndpointPrompt);
  });

  it('should return prompt with confirmation header', async () => {
    const result = await sut.getPrompt({
      moduleName: 'user',
      httpMethod: 'POST',
      description: 'Create user',
    });

    expect(result).toContain(EXECUTION_CONFIRMATION_HEADER);
  });

  it('should include module, method and description', async () => {
    const result = await sut.getPrompt({
      moduleName: 'account',
      httpMethod: 'GET',
      description: 'List accounts',
    });

    expect(result).toContain('# Add endpoint GET in account');
    expect(result).toContain('Description: List accounts');
  });

  it('should include DTO and controller sections', async () => {
    const result = await sut.getPrompt({
      moduleName: 'user',
      httpMethod: 'POST',
      description: 'Create',
    });

    expect(result).toContain('## 1. DTO (if needed)');
    expect(result).toContain('createZodDto');
    expect(result).toContain('## 2. Controller');
    expect(result).toContain('userController');
  });
});
