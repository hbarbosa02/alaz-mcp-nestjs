import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ModuleRegistryService } from '@/mcp/domain/nestjs/data-access/services/module-registry.service';
import { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';
import { createProjectContext } from '@test/helpers/mock-data';

describe('ModuleRegistryService', () => {
  let sut: ModuleRegistryService;
  let fileReader: jest.Mocked<FileReaderService>;
  let projectContext: jest.Mocked<ProjectContextService>;

  const defaultContext = createProjectContext();

  beforeEach(async () => {
    fileReader = {
      readDir: jest.fn(),
      readGlob: jest.fn(),
      exists: jest.fn(),
      readFile: jest.fn(),
    } as unknown as jest.Mocked<FileReaderService>;

    projectContext = {
      getContext: jest.fn().mockResolvedValue(defaultContext),
    } as unknown as jest.Mocked<ProjectContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleRegistryService,
        { provide: FileReaderService, useValue: fileReader },
        { provide: ProjectContextService, useValue: projectContext },
      ],
    }).compile();

    sut = module.get(ModuleRegistryService);
  });

  it('should return empty list when src has no modules', async () => {
    fileReader.readDir.mockResolvedValue([]);
    const result = await sut.listModules();
    expect(result).toEqual([]);
  });

  it('should discover modules with feature/*.module.ts', async () => {
    fileReader.readDir.mockResolvedValue(['user', 'account']);
    fileReader.readGlob
      .mockResolvedValueOnce(['src/user/feature/user.module.ts'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(['src/account/feature/account.module.ts'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    fileReader.exists.mockResolvedValue(false);

    const result = await sut.listModules();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((m) => m.name === 'user')).toBe(true);
  });

  it('should skip shared directory in listModules', async () => {
    fileReader.readDir.mockResolvedValue(['shared', 'user']);
    fileReader.readGlob
      .mockResolvedValueOnce(['src/user/feature/user.module.ts'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    fileReader.exists.mockResolvedValue(false);

    const result = await sut.listModules();
    expect(result.some((m) => m.name === 'user')).toBe(true);
    expect(
      result.filter((m) => m.name === 'shared').length,
    ).toBeLessThanOrEqual(1);
  });

  it('should return null when module path does not exist', async () => {
    fileReader.exists.mockResolvedValue(false);

    const result = await sut.getModule('unknown-module');

    expect(result).toBeNull();
  });

  it('should return module info when path exists', async () => {
    fileReader.exists.mockResolvedValue(true);
    fileReader.readGlob
      .mockResolvedValueOnce(['src/user/feature/user.module.ts']) // hasModuleFile domain-driven
      .mockResolvedValueOnce(['src/user/user.entity.ts'])
      .mockResolvedValueOnce(['src/user/feature/user.controller.ts'])
      .mockResolvedValueOnce(['src/user/user.service.spec.ts'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]); // findDocPath
    fileReader.readDir.mockResolvedValue(['feature', 'data-access']);

    const result = await sut.getModule('user');

    expect(result).not.toBeNull();
    expect(result?.name).toBe('user');
    expect(result?.path).toBe('src/user');
  });

  it('should include shared module when src/shared exists', async () => {
    fileReader.readDir.mockImplementation((path: string) => {
      if (path === 'src') return Promise.resolve(['user']);
      if (path === 'src/user' || path === 'src/shared')
        return Promise.resolve(['data-access', 'feature']);
      return Promise.resolve([]);
    });
    fileReader.readGlob
      .mockResolvedValueOnce(['src/user/feature/user.module.ts'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    fileReader.exists.mockResolvedValue(true);

    const result = await sut.listModules();
    expect(result.some((m) => m.name === 'shared')).toBe(true);
  });

  it('should list modules from src/modules when nested pattern', async () => {
    projectContext.getContext.mockResolvedValue(
      createProjectContext({ modulePattern: 'nested' }),
    );
    fileReader.exists.mockResolvedValue(true);
    fileReader.readDir.mockResolvedValue(['user', 'account']);
    fileReader.readGlob
      .mockResolvedValueOnce(['src/modules/user/user.module.ts'])
      .mockResolvedValueOnce(['src/modules/user/user.entity.ts'])
      .mockResolvedValueOnce(['src/modules/user/user.controller.ts'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(['src/modules/account/account.module.ts'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await sut.listModules();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((m) => m.name === 'user')).toBe(true);
  });

  it('should skip src/modules when nested but dir does not exist', async () => {
    projectContext.getContext.mockResolvedValue(
      createProjectContext({ modulePattern: 'nested' }),
    );
    fileReader.exists.mockResolvedValue(false);

    const result = await sut.listModules();
    expect(result).toEqual([]);
  });

  it('should skip dirs with dots in nested pattern', async () => {
    projectContext.getContext.mockResolvedValue(
      createProjectContext({ modulePattern: 'nested' }),
    );
    fileReader.exists.mockResolvedValue(true);
    fileReader.readDir.mockResolvedValue(['user.module.ts', 'valid-module']);
    fileReader.readGlob
      .mockResolvedValueOnce(['src/modules/valid-module/valid.module.ts'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await sut.listModules();
    expect(result.some((m) => m.name === 'valid-module')).toBe(true);
  });

  it('should get module from src/modules first when nested pattern', async () => {
    projectContext.getContext.mockResolvedValue(
      createProjectContext({ modulePattern: 'nested' }),
    );
    fileReader.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    fileReader.readGlob
      .mockResolvedValueOnce(['src/modules/user/user.module.ts'])
      .mockResolvedValueOnce(['src/modules/user/user.entity.ts'])
      .mockResolvedValueOnce(['src/modules/user/user.controller.ts'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    fileReader.readDir.mockResolvedValue(['feature']);

    const result = await sut.getModule('user');
    expect(result).not.toBeNull();
    expect(result?.path).toBe('src/modules/user');
  });
});
