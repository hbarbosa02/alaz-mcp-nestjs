import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ModuleDocsResource } from '@/mcp/domain/nestjs/feature/resources/module-docs.resource';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { createModuleInfo, createEndpointInfo, createFrameworkAdapterMocks } from '@test/helpers/mock-data';

describe('ModuleDocsResource', () => {
  let sut: ModuleDocsResource;
  let moduleRegistry: { getModule: jest.Mock };
  let docReader: { getFeatureDoc: jest.Mock };
  let codebaseAnalyzer: { getModuleEndpoints: jest.Mock };
  let mocks: ReturnType<typeof createFrameworkAdapterMocks>;

  beforeEach(async () => {
    moduleRegistry = { getModule: jest.fn() };
    docReader = { getFeatureDoc: jest.fn() };
    codebaseAnalyzer = { getModuleEndpoints: jest.fn() };

    mocks = createFrameworkAdapterMocks({
      moduleRegistry,
      documentationReader: docReader,
      codebaseAnalyzer,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleDocsResource,
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

    sut = module.get(ModuleDocsResource);
  });

  it('should return not found when module does not exist', async () => {
    moduleRegistry.getModule.mockResolvedValue(null);

    const result = await sut.getModuleDocs({ moduleName: 'unknown' });

    expect((result.contents[0] as { text: string }).text).toBe('Module "unknown" not found.');
  });

  it('should return module docs with endpoints and documentation', async () => {
    moduleRegistry.getModule.mockResolvedValue(createModuleInfo());
    docReader.getFeatureDoc.mockResolvedValue('# User docs');
    codebaseAnalyzer.getModuleEndpoints.mockResolvedValue([createEndpointInfo({ permissions: [] })]);

    const result = await sut.getModuleDocs({ moduleName: 'user' });

    const text = (result.contents[0] as { text: string }).text;
    expect(text).toContain('# Module: user');
    expect(text).toContain('## Endpoints');
    expect(text).toContain('## Documentation');
    expect(text).toContain('# User docs');
  });
});
