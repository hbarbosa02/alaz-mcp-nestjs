import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';
import { NewModulePrompt } from '@mcp/domain/nestjs/feature/prompts/new-module.prompt';
import { NewEndpointPrompt } from '@mcp/domain/nestjs/feature/prompts/new-endpoint.prompt';
import { UpdateDocsPrompt } from '@mcp/domain/nestjs/feature/prompts/update-docs.prompt';
import { CodeReviewPrompt } from '@mcp/domain/nestjs/feature/prompts/code-review.prompt';
import { InvestigateBugPrompt } from '@mcp/domain/nestjs/feature/prompts/investigate-bug.prompt';

const projectRootParam = z.string().optional().describe('Path to NestJS project root. Overrides MCP config.');

@Injectable()
export class PromptGuideTools {
  constructor(
    private readonly newModulePrompt: NewModulePrompt,
    private readonly newEndpointPrompt: NewEndpointPrompt,
    private readonly updateDocsPrompt: UpdateDocsPrompt,
    private readonly codeReviewPrompt: CodeReviewPrompt,
    private readonly investigateBugPrompt: InvestigateBugPrompt,
    private readonly projectRootContext: ProjectRootContextService,
  ) {}

  @Tool({
    name: 'get-create-module-guide',
    description:
      'Returns a step-by-step guide to create a module. Same content as create-module prompt. Output includes executable steps — agent MUST ask developer for confirmation before executing.',
    parameters: z.object({
      moduleName: z.string().describe('Module name (e.g. billing, notification)'),
      hasController: z.boolean().describe('Whether the module will have a controller'),
      hasEntity: z.boolean().describe('Whether the module will have entities (MikroORM, TypeORM, or Objection)'),
      projectRoot: projectRootParam,
    }),
  })
  getCreateModuleGuide(params: {
    moduleName: string;
    hasController: boolean;
    hasEntity: boolean;
    projectRoot?: string;
  }): Promise<string> {
    const doWork = async (): Promise<string> => {
      const result = await this.newModulePrompt.getPrompt({
        moduleName: params.moduleName,
        hasController: params.hasController,
        hasEntity: params.hasEntity,
      });
      return result.messages[0]?.content?.text ?? '';
    };

    if (params.projectRoot) {
      return this.projectRootContext.run(params.projectRoot, doWork);
    }
    return doWork();
  }

  @Tool({
    name: 'get-create-endpoint-guide',
    description:
      'Returns a step-by-step guide to add an endpoint. Same content as create-endpoint prompt. Output includes executable steps — agent MUST ask developer for confirmation before executing.',
    parameters: z.object({
      moduleName: z.string().describe('Module name'),
      httpMethod: z.enum(['GET', 'POST', 'PATCH', 'DELETE']).describe('HTTP method'),
      description: z.string().describe('Endpoint description'),
      projectRoot: projectRootParam,
    }),
  })
  getCreateEndpointGuide(params: {
    moduleName: string;
    httpMethod: string;
    description: string;
    projectRoot?: string;
  }): Promise<string> {
    const doWork = (): Promise<string> =>
      this.newEndpointPrompt.getPrompt({
        moduleName: params.moduleName,
        httpMethod: params.httpMethod,
        description: params.description,
      });

    if (params.projectRoot) {
      return this.projectRootContext.run(params.projectRoot, doWork);
    }
    return doWork();
  }

  @Tool({
    name: 'get-update-docs-guide',
    description:
      'Returns a step-by-step guide to update module documentation. Same content as update-documentation prompt. Output includes executable steps — agent MUST ask developer for confirmation before executing.',
    parameters: z.object({
      moduleName: z.string().describe('Name of the module that was changed'),
      projectRoot: projectRootParam,
    }),
  })
  getUpdateDocsGuide(params: { moduleName: string; projectRoot?: string }): Promise<string> {
    const doWork = (): Promise<string> => this.updateDocsPrompt.getPrompt({ moduleName: params.moduleName });

    if (params.projectRoot) {
      return this.projectRootContext.run(params.projectRoot, doWork);
    }
    return doWork();
  }

  @Tool({
    name: 'get-code-review-checklist',
    description:
      'Returns a code review checklist based on project conventions. Same content as code-review-checklist prompt.',
    parameters: z.object({
      moduleName: z.string().describe('Name of the module to review'),
      projectRoot: projectRootParam,
    }),
  })
  getCodeReviewChecklist(params: { moduleName: string; projectRoot?: string }): Promise<string> {
    const doWork = (): Promise<string> => this.codeReviewPrompt.getPrompt({ moduleName: params.moduleName });

    if (params.projectRoot) {
      return this.projectRootContext.run(params.projectRoot, doWork);
    }
    return doWork();
  }

  @Tool({
    name: 'get-investigate-bug-guide',
    description:
      'Returns a guide to investigate a bug. Same content as investigate-bug prompt. Output includes executable steps — agent MUST ask developer for confirmation before executing.',
    parameters: z.object({
      moduleName: z.string().describe('Name of the affected module'),
      bugDescription: z.string().describe('Bug description'),
      projectRoot: projectRootParam,
    }),
  })
  getInvestigateBugGuide(params: {
    moduleName: string;
    bugDescription: string;
    projectRoot?: string;
  }): Promise<string> {
    const doWork = (): Promise<string> =>
      this.investigateBugPrompt.getPrompt({
        moduleName: params.moduleName,
        bugDescription: params.bugDescription,
      });

    if (params.projectRoot) {
      return this.projectRootContext.run(params.projectRoot, doWork);
    }
    return doWork();
  }
}
