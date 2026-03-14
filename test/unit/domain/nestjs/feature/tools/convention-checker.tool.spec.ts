import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConventionCheckerTool } from '@/mcp/domain/nestjs/feature/tools/convention-checker.tool';
import type { ModuleRegistryService } from '@/mcp/domain/nestjs/data-access/services/module-registry.service';
import type { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { createModuleInfo, createProjectContext, createFrameworkAdapterMocks } from '@test/helpers/mock-data';

describe('ConventionCheckerTool', () => {
  let sut: ConventionCheckerTool;
  let moduleRegistry: jest.Mocked<ModuleRegistryService>;
  let fileReader: jest.Mocked<FileReaderService>;
  let projectContext: jest.Mocked<ProjectContextService>;

  beforeEach(async () => {
    moduleRegistry = {
      getModule: jest.fn(),
    } as unknown as jest.Mocked<ModuleRegistryService>;

    fileReader = {
      exists: jest.fn(),
      readGlob: jest.fn(),
      readFile: jest.fn(),
    } as unknown as jest.Mocked<FileReaderService>;

    projectContext = {
      getContext: jest.fn().mockResolvedValue(
        createProjectContext({
          docsLayout: { features: 'docs/features/' } as never,
        }),
      ),
    } as unknown as jest.Mocked<ProjectContextService>;

    const { frameworkDetector, adapterRegistry } = createFrameworkAdapterMocks({
      moduleRegistry,
      projectContext,
    });

    const projectRootContext = {
      run: jest.fn((_root: string, fn: () => unknown) => fn()),
    } as unknown as jest.Mocked<ProjectRootContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConventionCheckerTool,
        { provide: FrameworkDetectorService, useValue: frameworkDetector },
        { provide: FrameworkAdapterRegistryService, useValue: adapterRegistry },
        { provide: FileReaderService, useValue: fileReader },
        {
          provide: McpLoggerService,
          useValue: { logToolInvoked: jest.fn(), logToolResult: jest.fn() },
        },
        { provide: ProjectRootContextService, useValue: projectRootContext },
      ],
    }).compile();

    sut = module.get(ConventionCheckerTool);
  });

  it('should return not found when module does not exist', async () => {
    moduleRegistry.getModule.mockResolvedValue(null);

    const result = await sut.checkConventions({ moduleName: 'unknown' });

    expect(result).toBe('Module "unknown" not found.');
  });

  it('should return pass when module follows conventions', async () => {
    moduleRegistry.getModule.mockResolvedValue(createModuleInfo({ subModules: [] }));
    fileReader.exists.mockResolvedValue(true);
    fileReader.readGlob
      .mockResolvedValueOnce(['src/user/feature/user.module.ts'])
      .mockResolvedValueOnce(['src/user/feature/user.controller.ts']);
    fileReader.readFile.mockResolvedValue('@ApiTags("user")');

    const result = await sut.checkConventions({ moduleName: 'user' });

    expect(result).toContain('# Conventions: user');
    expect(result).toContain('✓');
  });

  it('should return fail when data-access is missing', async () => {
    moduleRegistry.getModule.mockResolvedValue(createModuleInfo({ entityNames: [], subModules: [] }));
    fileReader.exists
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    fileReader.readGlob.mockResolvedValueOnce(['src/user/feature/user.module.ts']).mockResolvedValueOnce([]);

    const result = await sut.checkConventions({ moduleName: 'user' });

    expect(result).toContain('✗');
  });
});
