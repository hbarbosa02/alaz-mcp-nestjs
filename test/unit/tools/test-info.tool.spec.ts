import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { TestInfoTool } from '@/mcp/domain/nestjs/feature/tools/test-info.tool';
import { ModuleRegistryService } from '@/mcp/domain/nestjs/data-access/services/module-registry.service';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';
import { createModuleInfo } from '../../helpers/mock-data';

describe('TestInfoTool', () => {
  let sut: TestInfoTool;
  let moduleRegistry: jest.Mocked<ModuleRegistryService>;
  let fileReader: jest.Mocked<FileReaderService>;

  beforeEach(async () => {
    moduleRegistry = {
      getModule: jest.fn(),
      listModules: jest.fn(),
    } as unknown as jest.Mocked<ModuleRegistryService>;

    fileReader = {
      readGlob: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<FileReaderService>;

    const projectRootContext = {
      run: jest.fn((root: string, fn: () => unknown) => fn()),
    } as unknown as jest.Mocked<ProjectRootContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestInfoTool,
        { provide: ModuleRegistryService, useValue: moduleRegistry },
        { provide: FileReaderService, useValue: fileReader },
        { provide: McpLoggerService, useValue: { logToolInvoked: jest.fn(), logToolResult: jest.fn() } },
        { provide: ProjectRootContextService, useValue: projectRootContext },
      ],
    }).compile();

    sut = module.get(TestInfoTool);
  });

  it('should return not found when module does not exist', async () => {
    moduleRegistry.getModule.mockResolvedValue(null);

    const result = await sut.getTestSummary({ moduleName: 'unknown' });

    expect(result).toBe('Module "unknown" not found.');
  });

  it('should return test summary for module', async () => {
    moduleRegistry.getModule.mockResolvedValue(createModuleInfo());
    fileReader.readGlob
      .mockResolvedValueOnce(['src/user/user.service.spec.ts'])
      .mockResolvedValueOnce(['src/user/user.e2e-spec.ts']);
    fileReader.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    const result = await sut.getTestSummary({ moduleName: 'user' });

    expect(result).toContain('# Testes: user');
    expect(result).toContain('Unit tests: 1');
    expect(result).toContain('E2E tests: 1');
    expect(result).toContain('Factories: Yes');
    expect(result).toContain('In-memory repos: Yes');
  });

  it('should return project-wide test summary when no module specified', async () => {
    moduleRegistry.listModules.mockResolvedValue([
      createModuleInfo({ name: 'user' }),
      createModuleInfo({ name: 'tenant', path: 'src/tenant' }),
    ]);
    fileReader.readGlob
      .mockResolvedValueOnce(['src/user/user.spec.ts'])
      .mockResolvedValueOnce(['src/user/user.e2e-spec.ts'])
      .mockResolvedValueOnce(['src/tenant/tenant.spec.ts'])
      .mockResolvedValueOnce([]);
    fileReader.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const result = await sut.getTestSummary({});

    expect(result).toContain('# Test Summary (project)');
    expect(result).toContain('Unit tests: 2');
    expect(result).toContain('E2E tests: 1');
  });
});
