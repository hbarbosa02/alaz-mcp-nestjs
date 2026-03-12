import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ModuleDocsResource } from '@/mcp/feature/resources/module-docs.resource';
import { ModuleRegistryService } from '@/mcp/data-access/services/module-registry.service';
import { DocumentationReaderService } from '@/mcp/data-access/services/documentation-reader.service';
import { CodebaseAnalyzerService } from '@/mcp/data-access/services/codebase-analyzer.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';
import { createModuleInfo, createEndpointInfo } from '../../helpers/mock-data';

describe('ModuleDocsResource', () => {
  let sut: ModuleDocsResource;
  let moduleRegistry: jest.Mocked<ModuleRegistryService>;
  let docReader: jest.Mocked<DocumentationReaderService>;
  let codebaseAnalyzer: jest.Mocked<CodebaseAnalyzerService>;

  beforeEach(async () => {
    moduleRegistry = {
      getModule: jest.fn(),
    } as unknown as jest.Mocked<ModuleRegistryService>;
    docReader = {
      getFeatureDoc: jest.fn(),
    } as unknown as jest.Mocked<DocumentationReaderService>;
    codebaseAnalyzer = {
      getModuleEndpoints: jest.fn(),
    } as unknown as jest.Mocked<CodebaseAnalyzerService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleDocsResource,
        { provide: ModuleRegistryService, useValue: moduleRegistry },
        { provide: DocumentationReaderService, useValue: docReader },
        { provide: CodebaseAnalyzerService, useValue: codebaseAnalyzer },
        { provide: McpLoggerService, useValue: { logResourceRead: jest.fn(), logResourceResult: jest.fn() } },
      ],
    }).compile();

    sut = module.get(ModuleDocsResource);
  });

  it('should return not found when module does not exist', async () => {
    moduleRegistry.getModule.mockResolvedValue(null);

    const result = await sut.getModuleDocs({ moduleName: 'unknown' });

    expect(result).toBe('Module "unknown" not found.');
  });

  it('should return module docs with endpoints and documentation', async () => {
    moduleRegistry.getModule.mockResolvedValue(createModuleInfo());
    docReader.getFeatureDoc.mockResolvedValue('# User docs');
    codebaseAnalyzer.getModuleEndpoints.mockResolvedValue([
      createEndpointInfo({ permissions: [] }),
    ]);

    const result = await sut.getModuleDocs({ moduleName: 'user' });

    expect(result).toContain('# Module: user');
    expect(result).toContain('## Endpoints');
    expect(result).toContain('## Documentation');
    expect(result).toContain('# User docs');
  });
});
