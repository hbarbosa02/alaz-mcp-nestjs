import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { OnboardingResource } from '@/mcp/domain/nestjs/feature/resources/onboarding.resource';
import { DocumentationReaderService } from '@/mcp/domain/nestjs/data-access/services/documentation-reader.service';
import { ModuleRegistryService } from '@/mcp/domain/nestjs/data-access/services/module-registry.service';
import { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { createModuleInfo, createProjectContext } from '../../helpers/mock-data';

describe('OnboardingResource', () => {
  let sut: OnboardingResource;
  let docReader: jest.Mocked<DocumentationReaderService>;
  let moduleRegistry: jest.Mocked<ModuleRegistryService>;
  let projectContext: jest.Mocked<ProjectContextService>;

  beforeEach(async () => {
    docReader = {
      getReadme: jest.fn(),
      getApiOverview: jest.fn(),
    } as unknown as jest.Mocked<DocumentationReaderService>;

    moduleRegistry = {
      listModules: jest.fn(),
    } as unknown as jest.Mocked<ModuleRegistryService>;

    projectContext = {
      getContext: jest.fn().mockResolvedValue(
        createProjectContext({
          docsLayout: {
            features: null,
            architecture: null,
            changelog: null,
            conventions: null,
            testing: null,
            entities: null,
            apiOverview: null,
          },
        }),
      ),
    } as unknown as jest.Mocked<ProjectContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingResource,
        { provide: DocumentationReaderService, useValue: docReader },
        { provide: ModuleRegistryService, useValue: moduleRegistry },
        { provide: ProjectContextService, useValue: projectContext },
        {
          provide: McpLoggerService,
          useValue: {
            logResourceRead: jest.fn(),
            logResourceResult: jest.fn(),
          },
        },
      ],
    }).compile();

    sut = module.get(OnboardingResource);
  });

  it('should return onboarding content with modules', async () => {
    docReader.getReadme.mockResolvedValue('# Project');
    docReader.getApiOverview.mockResolvedValue('# Architecture');
    moduleRegistry.listModules.mockResolvedValue([createModuleInfo()]);

    const result = await sut.getOnboarding();

    expect(result).toContain('# Onboarding — test-project');
    expect(result).toContain('## README');
    expect(result).toContain('# Project');
    expect(result).toContain('## Architecture');
    expect(result).toContain('## Modules');
    expect(result).toContain('Total: 1');
    expect(result).toContain('user');
  });

  it('should handle more than 20 modules', async () => {
    docReader.getReadme.mockResolvedValue(null);
    docReader.getApiOverview.mockResolvedValue(null);
    projectContext.getContext.mockResolvedValue(
      createProjectContext({
        docsLayout: {
          features: null,
          architecture: null,
          changelog: null,
          conventions: null,
          testing: null,
          entities: null,
          apiOverview: null,
        },
      }),
    );
    const modules = Array.from({ length: 25 }, (_, i) =>
      createModuleInfo({
        name: `mod${i}`,
        path: `src/mod${i}`,
        entityNames: [],
      }),
    );
    moduleRegistry.listModules.mockResolvedValue(modules);

    const result = await sut.getOnboarding();

    expect(result).toContain('... and 5 more');
  });
});
