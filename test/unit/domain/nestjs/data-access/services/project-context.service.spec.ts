import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';

describe('ProjectContextService', () => {
  let sut: ProjectContextService;
  let fileReader: jest.Mocked<FileReaderService>;

  beforeEach(async () => {
    fileReader = {
      readFile: jest.fn(),
      readDir: jest.fn(),
      readGlob: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<FileReaderService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectContextService,
        { provide: FileReaderService, useValue: fileReader },
      ],
    }).compile();

    sut = module.get(ProjectContextService);
  });

  it('should return default name when package.json is missing', async () => {
    fileReader.readFile.mockResolvedValue(null);
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.name).toBe('NestJS Project');
    expect(context.orm).toBeNull();
  });

  it('should return package name from package.json', async () => {
    fileReader.readFile.mockResolvedValue(
      JSON.stringify({ name: 'my-nestjs-app' }),
    );
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.name).toBe('my-nestjs-app');
  });

  it('should detect domain-driven pattern when feature/*.module.ts exists', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(JSON.stringify({ name: 'test-project' }));
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockImplementation((pattern: string) => {
      if (pattern === 'src/*/feature/*.module.ts')
        return Promise.resolve(['src/user/feature/user.module.ts']);
      return Promise.resolve([]);
    });
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.modulePattern).toBe('domain-driven');
  });

  it('should detect nested pattern when src/modules/* exists', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(JSON.stringify({ name: 'test-project' }));
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockImplementation((pattern: string) => {
      if (pattern === 'src/*/feature/*.module.ts') return Promise.resolve([]);
      if (pattern === 'src/modules/*/*.module.ts')
        return Promise.resolve(['src/modules/user/user.module.ts']);
      return Promise.resolve([]);
    });
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.modulePattern).toBe('nested');
  });

  it('should detect flat pattern when no domain-driven or nested', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(JSON.stringify({ name: 'test-project' }));
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.modulePattern).toBe('flat');
  });

  it('should detect mikroorm when mikro-orm is in dependencies', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(
          JSON.stringify({
            name: 'test-project',
            dependencies: { 'mikro-orm': '^5.0.0' },
          }),
        );
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.orm).toBe('mikroorm');
  });

  it('should detect typeorm when typeorm is in dependencies', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(
          JSON.stringify({
            name: 'test-project',
            dependencies: { typeorm: '^0.3.0' },
          }),
        );
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.orm).toBe('typeorm');
  });

  it('should detect objection when objection is in dependencies', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(
          JSON.stringify({
            name: 'test-project',
            dependencies: { objection: '^3.0.0' },
          }),
        );
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.orm).toBe('objection');
  });

  it('should prefer mikroorm over typeorm when both present', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(
          JSON.stringify({
            name: 'test-project',
            dependencies: { 'mikro-orm': '^5.0.0', typeorm: '^0.3.0' },
          }),
        );
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.orm).toBe('mikroorm');
  });

  it('should return null orm when no ORM in package.json', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(JSON.stringify({ name: 'test-project' }));
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.orm).toBeNull();
  });

  it('should cache context on subsequent calls', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(JSON.stringify({ name: 'cached-project' }));
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context1 = await sut.getContext();
    const context2 = await sut.getContext();

    expect(context1).toBe(context2);
    expect(context1.name).toBe('cached-project');
    expect(fileReader.readFile).toHaveBeenCalledWith('package.json');
  });
});
