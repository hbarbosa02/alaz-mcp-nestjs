import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ModuleEndpointsResource } from '@/mcp/domain/nestjs/feature/resources/module-endpoints.resource';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import {
  createModuleInfo,
  createEndpointInfo,
  createFrameworkAdapterMocks,
} from '@test/helpers/mock-data';

describe('ModuleEndpointsResource', () => {
  let sut: ModuleEndpointsResource;
  let moduleRegistry: { getModule: jest.Mock };
  let codebaseAnalyzer: { getModuleEndpoints: jest.Mock };
  let mocks: ReturnType<typeof createFrameworkAdapterMocks>;

  beforeEach(async () => {
    moduleRegistry = { getModule: jest.fn() };
    codebaseAnalyzer = { getModuleEndpoints: jest.fn() };

    mocks = createFrameworkAdapterMocks({
      moduleRegistry,
      codebaseAnalyzer,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleEndpointsResource,
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

    sut = module.get(ModuleEndpointsResource);
  });

  it('should return not found when module does not exist', async () => {
    moduleRegistry.getModule.mockResolvedValue(null);

    const result = await sut.getModuleEndpoints({ moduleName: 'unknown' });

    expect((result.contents[0] as { text: string }).text).toBe(
      'Module "unknown" not found.',
    );
  });

  it('should return endpoints table', async () => {
    moduleRegistry.getModule.mockResolvedValue(createModuleInfo());
    codebaseAnalyzer.getModuleEndpoints.mockResolvedValue([
      createEndpointInfo(),
    ]);

    const result = await sut.getModuleEndpoints({ moduleName: 'user' });

    const text = (result.contents[0] as { text: string }).text;
    expect(text).toContain('# Endpoints: user');
    expect(text).toContain('| Method | Path | Permissions | Auth |');
    expect(text).toContain('GET');
    expect(text).toContain('/user');
  });
});
