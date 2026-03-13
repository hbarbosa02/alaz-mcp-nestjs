import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ModuleExplorerTool } from '@/mcp/domain/nestjs/feature/tools/module-explorer.tool';
import { ModuleRegistryService } from '@/mcp/domain/nestjs/data-access/services/module-registry.service';
import { DocumentationReaderService } from '@/mcp/domain/nestjs/data-access/services/documentation-reader.service';
import { CodebaseAnalyzerService } from '@/mcp/domain/nestjs/data-access/services/codebase-analyzer.service';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { createModuleInfo, createEndpointInfo, createFrameworkAdapterMocks } from '../../helpers/mock-data';

describe('ModuleExplorerTool', () => {
  let sut: ModuleExplorerTool;
  let moduleRegistry: jest.Mocked<ModuleRegistryService>;
  let docReader: jest.Mocked<DocumentationReaderService>;
  let codebaseAnalyzer: jest.Mocked<CodebaseAnalyzerService>;
  let frameworkDetector: { detect: jest.Mock };
  let adapterRegistry: { getUnsupportedMessage: jest.Mock };

  beforeEach(async () => {
    moduleRegistry = {
      listModules: jest.fn(),
      getModule: jest.fn(),
    } as unknown as jest.Mocked<ModuleRegistryService>;

    docReader = {
      getFeatureDoc: jest.fn(),
    } as unknown as jest.Mocked<DocumentationReaderService>;

    codebaseAnalyzer = {
      getModuleEndpoints: jest.fn(),
    } as unknown as jest.Mocked<CodebaseAnalyzerService>;

    const mocks = createFrameworkAdapterMocks({
      moduleRegistry,
      documentationReader: docReader,
      codebaseAnalyzer,
    });
    frameworkDetector = mocks.frameworkDetector as { detect: jest.Mock };
    adapterRegistry = mocks.adapterRegistry as { getUnsupportedMessage: jest.Mock };

    const projectRootContext = {
      run: jest.fn((_root: string, fn: () => unknown) => fn()),
    } as unknown as jest.Mocked<ProjectRootContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleExplorerTool,
        { provide: FrameworkDetectorService, useValue: mocks.frameworkDetector },
        { provide: FrameworkAdapterRegistryService, useValue: mocks.adapterRegistry },
        { provide: McpLoggerService, useValue: { logToolInvoked: jest.fn(), logToolResult: jest.fn() } },
        { provide: ProjectRootContextService, useValue: projectRootContext },
      ],
    }).compile();

    sut = module.get(ModuleExplorerTool);
  });

  describe('listModules', () => {
    it('should return unsupported message when framework is null', async () => {
      frameworkDetector.detect.mockResolvedValue(null);
      adapterRegistry.getUnsupportedMessage.mockReturnValue(
        'Projeto não parece ser NestJS, Angular ou Laravel. Frameworks suportados: NestJS (implementado), Angular e Laravel (em breve).',
      );

      const result = await sut.listModules();

      expect(result).toContain('Frameworks suportados');
    });

    it('should return markdown table with modules', async () => {
      moduleRegistry.listModules.mockResolvedValue([
        createModuleInfo({ subModules: [] }),
      ]);

      const result = await sut.listModules();

      expect(result).toContain(
        '| Module | Controller | Entities | Tests | Docs |',
      );
      expect(result).toContain('user');
      expect(result).toContain('✓');
    });
  });

  describe('getModuleDetail', () => {
    it('should return not found when module does not exist', async () => {
      moduleRegistry.getModule.mockResolvedValue(null);

      const result = await sut.getModuleDetail({ moduleName: 'unknown' });

      expect(result).toBe(
        'Module "unknown" not found. Use list-modules to see available modules.',
      );
    });

    it('should return full module details with endpoints and doc', async () => {
      moduleRegistry.getModule.mockResolvedValue(createModuleInfo());
      docReader.getFeatureDoc.mockResolvedValue('# User docs');
      codebaseAnalyzer.getModuleEndpoints.mockResolvedValue([
        createEndpointInfo(),
      ]);

      const result = await sut.getModuleDetail({ moduleName: 'user' });

      expect(result).toContain('# Module: user');
      expect(result).toContain('Path: `src/user`');
      expect(result).toContain('## Endpoints');
      expect(result).toContain('GET');
      expect(result).toContain('## Documentation');
      expect(result).toContain('# User docs');
    });
  });
});
