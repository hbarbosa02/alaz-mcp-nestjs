import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PathResolverService } from '@/mcp/util/data-access/services/path-resolver.service';

describe('PathResolverService', () => {
  let sut: PathResolverService;
  const projectRoot = '/home/project';

  beforeEach(async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue(projectRoot),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PathResolverService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    sut = module.get(PathResolverService);
  });

  it('should return project root from config', () => {
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
