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
      providers: [ProjectContextService, { provide: FileReaderService, useValue: fileReader }],
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
    fileReader.readFile.mockResolvedValue(JSON.stringify({ name: 'my-nestjs-app' }));
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.name).toBe('my-nestjs-app');
  });

  it('should detect domain-driven pattern when feature/*.module.ts exists', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json') return Promise.resolve(JSON.stringify({ name: 'test-project' }));
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockImplementation((pattern: string) => {
      if (pattern === 'src/*/feature/*.module.ts') return Promise.resolve(['src/user/feature/user.module.ts']);
      return Promise.resolve([]);
    });
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.modulePattern).toBe('domain-driven');
  });

  it('should detect nested pattern when src/modules/* exists', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json') return Promise.resolve(JSON.stringify({ name: 'test-project' }));
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockImplementation((pattern: string) => {
      if (pattern === 'src/*/feature/*.module.ts') return Promise.resolve([]);
      if (pattern === 'src/modules/*/*.module.ts') return Promise.resolve(['src/modules/user/user.module.ts']);
      return Promise.resolve([]);
    });
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.modulePattern).toBe('nested');
  });

  it('should detect flat pattern when no domain-driven or nested', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json') return Promise.resolve(JSON.stringify({ name: 'test-project' }));
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
      if (path === 'package.json') return Promise.resolve(JSON.stringify({ name: 'test-project' }));
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();

    expect(context.orm).toBeNull();
  });

  it('should cache context on subsequent calls', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json') return Promise.resolve(JSON.stringify({ name: 'cached-project' }));
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

  it('should detect database pg', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(
          JSON.stringify({
            name: 'test-project',
            dependencies: { pg: '^8.0.0' },
          }),
        );
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();
    expect(context.stack.database).toBe('PostgreSQL');
  });

  it('should detect database mysql2', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(
          JSON.stringify({
            name: 'test-project',
            dependencies: { mysql2: '^3.0.0' },
          }),
        );
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();
    expect(context.stack.database).toBe('MySQL');
  });

  it('should detect redis and bullmq', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(
          JSON.stringify({
            name: 'test-project',
            dependencies: { ioredis: '^5.0.0', bullmq: '^4.0.0' },
          }),
        );
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();
    expect(context.stack.redis).toBe(true);
    expect(context.stack.bullmq).toBe(true);
  });

  it('should detect nestjs-zod validation', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(
          JSON.stringify({
            name: 'test-project',
            dependencies: { 'nestjs-zod': '^2.0.0' },
          }),
        );
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();
    expect(context.stack.validation).toBe('nestjs-zod');
  });

  it('should detect class-validator', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(
          JSON.stringify({
            name: 'test-project',
            dependencies: { 'class-validator': '^0.14.0' },
          }),
        );
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();
    expect(context.stack.validation).toBe('class-validator');
  });

  it('should detect jest test framework', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(
          JSON.stringify({
            name: 'test-project',
            devDependencies: { jest: '^29.0.0' },
          }),
        );
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();
    expect(context.stack.testFramework).toBe('jest');
    expect(context.stack.testFrameworkVersion).toBe('^29.0.0');
  });

  it('should detect vitest test framework', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json')
        return Promise.resolve(
          JSON.stringify({
            name: 'test-project',
            devDependencies: { vitest: '^1.0.0' },
          }),
        );
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();
    expect(context.stack.testFramework).toBe('vitest');
  });

  it('should detect docs layout changelog from CHANGELOG.md', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json') return Promise.resolve(JSON.stringify({ name: 'test-project' }));
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockImplementation((p: string) => {
      if (p === 'CHANGELOG.md') return Promise.resolve(true);
      return Promise.resolve(false);
    });

    const context = await sut.getContext();
    expect(context.docsLayout.changelog).toBe('CHANGELOG.md');
  });

  it('should detect docs layout features from docs/features', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json') return Promise.resolve(JSON.stringify({ name: 'test-project' }));
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockImplementation((p: string) => {
      if (p === 'docs/features') return Promise.resolve(true);
      return Promise.resolve(false);
    });

    const context = await sut.getContext();
    expect(context.docsLayout.features).toBe('docs/features/');
  });

  it('should detect path aliases from tsconfig', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json') return Promise.resolve(JSON.stringify({ name: 'test-project' }));
      if (path === 'tsconfig.json')
        return Promise.resolve(
          JSON.stringify({
            compilerOptions: {
              paths: { '@/*': ['src/*'], '@app/*': ['src/app/*'] },
            },
          }),
        );
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();
    expect(context.pathAliases).toEqual({
      '@/*': ['src/*'],
      '@app/*': ['src/app/*'],
    });
  });

  it('should return empty path aliases when tsconfig missing', async () => {
    fileReader.readFile.mockImplementation((path: string) => {
      if (path === 'package.json') return Promise.resolve(JSON.stringify({ name: 'test-project' }));
      return Promise.resolve(null);
    });
    fileReader.readGlob.mockResolvedValue([]);
    fileReader.exists.mockResolvedValue(false);

    const context = await sut.getContext();
    expect(context.pathAliases).toEqual({});
  });
});
