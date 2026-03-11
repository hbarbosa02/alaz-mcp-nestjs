import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ModuleEndpointsResource } from '@/mcp/feature/resources/module-endpoints.resource';
import { ModuleRegistryService } from '@/mcp/data-access/services/module-registry.service';
import { CodebaseAnalyzerService } from '@/mcp/data-access/services/codebase-analyzer.service';
import { createModuleInfo, createEndpointInfo } from '../../helpers/mock-data';

describe('ModuleEndpointsResource', () => {
  let sut: ModuleEndpointsResource;
  let moduleRegistry: jest.Mocked<ModuleRegistryService>;
  let codebaseAnalyzer: jest.Mocked<CodebaseAnalyzerService>;

  beforeEach(async () => {
    moduleRegistry = {
      getModule: jest.fn(),
    } as unknown as jest.Mocked<ModuleRegistryService>;
    codebaseAnalyzer = {
      getModuleEndpoints: jest.fn(),
    } as unknown as jest.Mocked<CodebaseAnalyzerService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleEndpointsResource,
        { provide: ModuleRegistryService, useValue: moduleRegistry },
        { provide: CodebaseAnalyzerService, useValue: codebaseAnalyzer },
      ],
    }).compile();

    sut = module.get(ModuleEndpointsResource);
  });

  it('should return not found when module does not exist', async () => {
    moduleRegistry.getModule.mockResolvedValue(null);

    const result = await sut.getModuleEndpoints({ moduleName: 'unknown' });

    expect(result).toBe('Module "unknown" not found.');
  });

  it('should return endpoints table', async () => {
    moduleRegistry.getModule.mockResolvedValue(createModuleInfo());
    codebaseAnalyzer.getModuleEndpoints.mockResolvedValue([
      createEndpointInfo(),
    ]);

    const result = await sut.getModuleEndpoints({ moduleName: 'user' });

    expect(result).toContain('# Endpoints: user');
    expect(result).toContain('| Method | Path | Permissions | Auth |');
    expect(result).toContain('GET');
    expect(result).toContain('/user');
  });
});
