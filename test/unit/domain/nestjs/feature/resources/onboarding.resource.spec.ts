import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { OnboardingResource } from '@/mcp/domain/nestjs/feature/resources/onboarding.resource';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import {
  createModuleInfo,
  createProjectContext,
  createFrameworkAdapterMocks,
} from '@test/helpers/mock-data';

describe('OnboardingResource', () => {
  let sut: OnboardingResource;
  let docReader: { getReadme: jest.Mock; getApiOverview: jest.Mock };
  let moduleRegistry: { listModules: jest.Mock };
  let projectContext: { getContext: jest.Mock };
  let mocks: ReturnType<typeof createFrameworkAdapterMocks>;

  beforeEach(async () => {
    docReader = {
      getReadme: jest.fn(),
      getApiOverview: jest.fn(),
    };

    moduleRegistry = { listModules: jest.fn() };

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
    };

    mocks = createFrameworkAdapterMocks({
      documentationReader: docReader,
      moduleRegistry,
      projectContext,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingResource,
        {
          provide: FrameworkDetectorService,
          useValue: mocks.frameworkDetector,
        },
        {
          provide: FrameworkAdapterRegistryService,
          useValue: mocks.adapterRegistry,
        },
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

    expect(result).toMatchObject({
      contents: [{ uri: 'alaz://onboarding', mimeType: 'text/markdown' }],
    });
    const text = (result.contents[0] as { text: string }).text;
    expect(text).toContain('# Onboarding — test-project');
    expect(text).toContain('## README');
    expect(text).toContain('# Project');
    expect(text).toContain('## Architecture');
    expect(text).toContain('## Modules');
    expect(text).toContain('Total: 1');
    expect(text).toContain('user');
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

    expect((result.contents[0] as { text: string }).text).toContain(
      '... and 5 more',
    );
  });
});
