import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConventionCheckerTool } from '@/mcp/feature/tools/convention-checker.tool';
import { ModuleRegistryService } from '@/mcp/data-access/services/module-registry.service';
import { FileReaderService } from '@/mcp/util/data-access/services/file-reader.service';
import { createModuleInfo } from '../../helpers/mock-data';

describe('ConventionCheckerTool', () => {
  let sut: ConventionCheckerTool;
  let moduleRegistry: jest.Mocked<ModuleRegistryService>;
  let fileReader: jest.Mocked<FileReaderService>;

  beforeEach(async () => {
    moduleRegistry = {
      getModule: jest.fn(),
    } as unknown as jest.Mocked<ModuleRegistryService>;

    fileReader = {
      exists: jest.fn(),
      readGlob: jest.fn(),
      readFile: jest.fn(),
    } as unknown as jest.Mocked<FileReaderService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConventionCheckerTool,
        { provide: ModuleRegistryService, useValue: moduleRegistry },
        { provide: FileReaderService, useValue: fileReader },
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
    moduleRegistry.getModule.mockResolvedValue(
      createModuleInfo({ subModules: [] }),
    );
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
    moduleRegistry.getModule.mockResolvedValue(
      createModuleInfo({ entityNames: [], subModules: [] }),
    );
    fileReader.exists
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    fileReader.readGlob
      .mockResolvedValueOnce(['src/user/feature/user.module.ts'])
      .mockResolvedValueOnce([]);

    const result = await sut.checkConventions({ moduleName: 'user' });

    expect(result).toContain('✗');
  });
});
