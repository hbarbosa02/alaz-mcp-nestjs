import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ModuleExplorerTool } from '@/mcp/domain/nestjs/feature/tools/module-explorer.tool';
import { ModuleRegistryService } from '@/mcp/domain/nestjs/data-access/services/module-registry.service';
import { DocumentationReaderService } from '@/mcp/domain/nestjs/data-access/services/documentation-reader.service';
import { CodebaseAnalyzerService } from '@/mcp/domain/nestjs/data-access/services/codebase-analyzer.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';
import { createModuleInfo, createEndpointInfo } from '../../helpers/mock-data';

describe('ModuleExplorerTool', () => {
  let sut: ModuleExplorerTool;
  let moduleRegistry: jest.Mocked<ModuleRegistryService>;
  let docReader: jest.Mocked<DocumentationReaderService>;
  let codebaseAnalyzer: jest.Mocked<CodebaseAnalyzerService>;

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

    const projectRootContext = {
      run: jest.fn((root: string, fn: () => unknown) => fn()),
    } as unknown as jest.Mocked<ProjectRootContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleExplorerTool,
        { provide: ModuleRegistryService, useValue: moduleRegistry },
        { provide: DocumentationReaderService, useValue: docReader },
        { provide: CodebaseAnalyzerService, useValue: codebaseAnalyzer },
        { provide: McpLoggerService, useValue: { logToolInvoked: jest.fn(), logToolResult: jest.fn() } },
        { provide: ProjectRootContextService, useValue: projectRootContext },
      ],
    }).compile();

    sut = module.get(ModuleExplorerTool);
  });

  describe('listModules', () => {
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
