import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PromptGuideTools } from '@/mcp/domain/nestjs/feature/tools/prompt-guide.tools';
import { NewModulePrompt } from '@/mcp/domain/nestjs/feature/prompts/new-module.prompt';
import { NewEndpointPrompt } from '@/mcp/domain/nestjs/feature/prompts/new-endpoint.prompt';
import { UpdateDocsPrompt } from '@/mcp/domain/nestjs/feature/prompts/update-docs.prompt';
import { CodeReviewPrompt } from '@/mcp/domain/nestjs/feature/prompts/code-review.prompt';
import { InvestigateBugPrompt } from '@/mcp/domain/nestjs/feature/prompts/investigate-bug.prompt';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';

describe('PromptGuideTools', () => {
  let sut: PromptGuideTools;
  let newModulePrompt: jest.Mocked<NewModulePrompt>;
  let newEndpointPrompt: jest.Mocked<NewEndpointPrompt>;
  let updateDocsPrompt: jest.Mocked<UpdateDocsPrompt>;
  let codeReviewPrompt: jest.Mocked<CodeReviewPrompt>;
  let investigateBugPrompt: jest.Mocked<InvestigateBugPrompt>;
  let projectRootContext: jest.Mocked<ProjectRootContextService>;

  beforeEach(async () => {
    newModulePrompt = {
      getPrompt: jest.fn(),
    } as unknown as jest.Mocked<NewModulePrompt>;

    newEndpointPrompt = {
      getPrompt: jest.fn(),
    } as unknown as jest.Mocked<NewEndpointPrompt>;

    updateDocsPrompt = {
      getPrompt: jest.fn(),
    } as unknown as jest.Mocked<UpdateDocsPrompt>;

    codeReviewPrompt = {
      getPrompt: jest.fn(),
    } as unknown as jest.Mocked<CodeReviewPrompt>;

    investigateBugPrompt = {
      getPrompt: jest.fn(),
    } as unknown as jest.Mocked<InvestigateBugPrompt>;

    projectRootContext = {
      run: jest.fn((_root: string, fn: () => unknown) => fn()),
    } as unknown as jest.Mocked<ProjectRootContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptGuideTools,
        { provide: NewModulePrompt, useValue: newModulePrompt },
        { provide: NewEndpointPrompt, useValue: newEndpointPrompt },
        { provide: UpdateDocsPrompt, useValue: updateDocsPrompt },
        { provide: CodeReviewPrompt, useValue: codeReviewPrompt },
        { provide: InvestigateBugPrompt, useValue: investigateBugPrompt },
        { provide: ProjectRootContextService, useValue: projectRootContext },
      ],
    }).compile();

    sut = module.get(PromptGuideTools);
  });

  describe('getCreateModuleGuide', () => {
    it('should delegate to NewModulePrompt and return content text', async () => {
      const expectedText = '# Create module billing';
      newModulePrompt.getPrompt.mockResolvedValue({
        messages: [{ role: 'user', content: { type: 'text', text: expectedText } }],
      });

      const result = await sut.getCreateModuleGuide({
        moduleName: 'billing',
        hasController: true,
        hasEntity: true,
      });

      expect(newModulePrompt.getPrompt).toHaveBeenCalledWith({
        moduleName: 'billing',
        hasController: true,
        hasEntity: true,
      });
      expect(result).toBe(expectedText);
    });

    it('should return empty string when messages content is missing', async () => {
      newModulePrompt.getPrompt.mockResolvedValue({
        messages: [],
      });

      const result = await sut.getCreateModuleGuide({
        moduleName: 'billing',
        hasController: false,
        hasEntity: false,
      });

      expect(result).toBe('');
    });

    it('should use projectRootContext.run when projectRoot provided', async () => {
      const runMock = jest.fn((_root: string, fn: () => unknown) => fn());
      const customProjectRootContext = {
        run: runMock,
      } as unknown as jest.Mocked<ProjectRootContextService>;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PromptGuideTools,
          { provide: NewModulePrompt, useValue: newModulePrompt },
          { provide: NewEndpointPrompt, useValue: newEndpointPrompt },
          { provide: UpdateDocsPrompt, useValue: updateDocsPrompt },
          { provide: CodeReviewPrompt, useValue: codeReviewPrompt },
          { provide: InvestigateBugPrompt, useValue: investigateBugPrompt },
          {
            provide: ProjectRootContextService,
            useValue: customProjectRootContext,
          },
        ],
      }).compile();

      const tool = module.get(PromptGuideTools);
      newModulePrompt.getPrompt.mockResolvedValue({
        messages: [{ role: 'user', content: { type: 'text', text: 'guide' } }],
      });

      await tool.getCreateModuleGuide({
        moduleName: 'billing',
        hasController: true,
        hasEntity: true,
        projectRoot: '/custom/path',
      });

      expect(runMock).toHaveBeenCalledWith(
        '/custom/path',
        expect.any(Function),
      );
    });
  });

  describe('getCreateEndpointGuide', () => {
    it('should delegate to NewEndpointPrompt and return content', async () => {
      const expectedContent = '# Add endpoint POST in user';
      newEndpointPrompt.getPrompt.mockResolvedValue(expectedContent);

      const result = await sut.getCreateEndpointGuide({
        moduleName: 'user',
        httpMethod: 'POST',
        description: 'Create user',
      });

      expect(newEndpointPrompt.getPrompt).toHaveBeenCalledWith({
        moduleName: 'user',
        httpMethod: 'POST',
        description: 'Create user',
      });
      expect(result).toBe(expectedContent);
    });

    it('should use projectRootContext.run when projectRoot provided', async () => {
      const runMock = jest.fn((_root: string, fn: () => unknown) => fn());
      const customProjectRootContext = {
        run: runMock,
      } as unknown as jest.Mocked<ProjectRootContextService>;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PromptGuideTools,
          { provide: NewModulePrompt, useValue: newModulePrompt },
          { provide: NewEndpointPrompt, useValue: newEndpointPrompt },
          { provide: UpdateDocsPrompt, useValue: updateDocsPrompt },
          { provide: CodeReviewPrompt, useValue: codeReviewPrompt },
          { provide: InvestigateBugPrompt, useValue: investigateBugPrompt },
          {
            provide: ProjectRootContextService,
            useValue: customProjectRootContext,
          },
        ],
      }).compile();

      const tool = module.get(PromptGuideTools);
      newEndpointPrompt.getPrompt.mockResolvedValue('endpoint guide');

      await tool.getCreateEndpointGuide({
        moduleName: 'user',
        httpMethod: 'GET',
        description: 'List users',
        projectRoot: '/custom/path',
      });

      expect(runMock).toHaveBeenCalledWith(
        '/custom/path',
        expect.any(Function),
      );
    });
  });

  describe('getUpdateDocsGuide', () => {
    it('should delegate to UpdateDocsPrompt and return content', async () => {
      const expectedContent = '# Update docs for user module';
      updateDocsPrompt.getPrompt.mockResolvedValue(expectedContent);

      const result = await sut.getUpdateDocsGuide({
        moduleName: 'user',
      });

      expect(updateDocsPrompt.getPrompt).toHaveBeenCalledWith({
        moduleName: 'user',
      });
      expect(result).toBe(expectedContent);
    });

    it('should use projectRootContext.run when projectRoot provided', async () => {
      const runMock = jest.fn((_root: string, fn: () => unknown) => fn());
      const customProjectRootContext = {
        run: runMock,
      } as unknown as jest.Mocked<ProjectRootContextService>;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PromptGuideTools,
          { provide: NewModulePrompt, useValue: newModulePrompt },
          { provide: NewEndpointPrompt, useValue: newEndpointPrompt },
          { provide: UpdateDocsPrompt, useValue: updateDocsPrompt },
          { provide: CodeReviewPrompt, useValue: codeReviewPrompt },
          { provide: InvestigateBugPrompt, useValue: investigateBugPrompt },
          {
            provide: ProjectRootContextService,
            useValue: customProjectRootContext,
          },
        ],
      }).compile();

      const tool = module.get(PromptGuideTools);
      updateDocsPrompt.getPrompt.mockResolvedValue('update docs guide');

      await tool.getUpdateDocsGuide({
        moduleName: 'user',
        projectRoot: '/custom/path',
      });

      expect(runMock).toHaveBeenCalledWith(
        '/custom/path',
        expect.any(Function),
      );
    });
  });

  describe('getCodeReviewChecklist', () => {
    it('should delegate to CodeReviewPrompt and return content', async () => {
      const expectedContent = '# Code review checklist for user';
      codeReviewPrompt.getPrompt.mockResolvedValue(expectedContent);

      const result = await sut.getCodeReviewChecklist({
        moduleName: 'user',
      });

      expect(codeReviewPrompt.getPrompt).toHaveBeenCalledWith({
        moduleName: 'user',
      });
      expect(result).toBe(expectedContent);
    });

    it('should use projectRootContext.run when projectRoot provided', async () => {
      const runMock = jest.fn((_root: string, fn: () => unknown) => fn());
      const customProjectRootContext = {
        run: runMock,
      } as unknown as jest.Mocked<ProjectRootContextService>;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PromptGuideTools,
          { provide: NewModulePrompt, useValue: newModulePrompt },
          { provide: NewEndpointPrompt, useValue: newEndpointPrompt },
          { provide: UpdateDocsPrompt, useValue: updateDocsPrompt },
          { provide: CodeReviewPrompt, useValue: codeReviewPrompt },
          { provide: InvestigateBugPrompt, useValue: investigateBugPrompt },
          {
            provide: ProjectRootContextService,
            useValue: customProjectRootContext,
          },
        ],
      }).compile();

      const tool = module.get(PromptGuideTools);
      codeReviewPrompt.getPrompt.mockResolvedValue('checklist');

      await tool.getCodeReviewChecklist({
        moduleName: 'user',
        projectRoot: '/custom/path',
      });

      expect(runMock).toHaveBeenCalledWith(
        '/custom/path',
        expect.any(Function),
      );
    });
  });

  describe('getInvestigateBugGuide', () => {
    it('should delegate to InvestigateBugPrompt and return content', async () => {
      const expectedContent = '# Investigate bug in user';
      investigateBugPrompt.getPrompt.mockResolvedValue(expectedContent);

      const result = await sut.getInvestigateBugGuide({
        moduleName: 'user',
        bugDescription: 'Null pointer on save',
      });

      expect(investigateBugPrompt.getPrompt).toHaveBeenCalledWith({
        moduleName: 'user',
        bugDescription: 'Null pointer on save',
      });
      expect(result).toBe(expectedContent);
    });

    it('should use projectRootContext.run when projectRoot provided', async () => {
      const runMock = jest.fn((_root: string, fn: () => unknown) => fn());
      const customProjectRootContext = {
        run: runMock,
      } as unknown as jest.Mocked<ProjectRootContextService>;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PromptGuideTools,
          { provide: NewModulePrompt, useValue: newModulePrompt },
          { provide: NewEndpointPrompt, useValue: newEndpointPrompt },
          { provide: UpdateDocsPrompt, useValue: updateDocsPrompt },
          { provide: CodeReviewPrompt, useValue: codeReviewPrompt },
          { provide: InvestigateBugPrompt, useValue: investigateBugPrompt },
          {
            provide: ProjectRootContextService,
            useValue: customProjectRootContext,
          },
        ],
      }).compile();

      const tool = module.get(PromptGuideTools);
      investigateBugPrompt.getPrompt.mockResolvedValue('investigate guide');

      await tool.getInvestigateBugGuide({
        moduleName: 'user',
        bugDescription: 'Bug',
        projectRoot: '/custom/path',
      });

      expect(runMock).toHaveBeenCalledWith(
        '/custom/path',
        expect.any(Function),
      );
    });
  });
});
