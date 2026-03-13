import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PathResolverService } from '@/mcp/util/data-access/services/path-resolver.service';
import { ProjectRootContextService } from '@/mcp/data-access/services/project-root-context.service';

describe('PathResolverService', () => {
  let sut: PathResolverService;
  const projectRoot = '/home/project';

  beforeEach(async () => {
    const projectRootContext = {
      getProjectRoot: jest.fn().mockReturnValue(projectRoot),
    } as unknown as jest.Mocked<ProjectRootContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PathResolverService,
        { provide: ProjectRootContextService, useValue: projectRootContext },
      ],
    }).compile();

    sut = module.get(PathResolverService);
  });

  it('should return project root from context', () => {
    expect(sut.root).toBe(projectRoot);
  });

  it('should resolve single segment', () => {
    const result = sut.resolve('docs');
    expect(result).toContain(projectRoot);
    expect(result).toContain('docs');
  });

  it('should resolve multiple segments', () => {
    const result = sut.resolve('docs', 'architecture', 'API.md');
    expect(result).toContain(projectRoot);
    expect(result).toContain('docs');
    expect(result).toContain('architecture');
    expect(result).toContain('API.md');
  });
});
