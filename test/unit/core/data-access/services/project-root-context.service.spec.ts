import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';

describe('ProjectRootContextService', () => {
  let service: ProjectRootContextService;
  let configGet: jest.Mock;

  beforeEach(async () => {
    configGet = jest.fn().mockReturnValue(undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [ProjectRootContextService, { provide: ConfigService, useValue: { get: configGet } }],
    }).compile();
    service = moduleRef.get(ProjectRootContextService);
  });

  it('should return project root from run()', () => {
    const result = service.run('/path/to/project', () => {
      return service.getProjectRoot();
    });
    expect(result).toBe('/path/to/project');
  });

  it('should throw when getProjectRoot called outside run() and no PROJECT_ROOT in config', () => {
    expect(() => service.getProjectRoot()).toThrow(/Project root is required/);
  });

  it('should fall back to ConfigService PROJECT_ROOT when ALS store is empty', () => {
    configGet.mockReturnValue('/from/config');
    expect(service.getProjectRoot()).toBe('/from/config');
    expect(configGet).toHaveBeenCalledWith('PROJECT_ROOT');
  });

  it('should trim ConfigService PROJECT_ROOT when falling back', () => {
    configGet.mockReturnValue('  /from/config  ');
    expect(service.getProjectRoot()).toBe('/from/config');
  });

  it('should prefer ALS over ConfigService when inside run()', () => {
    configGet.mockReturnValue('/from/config');
    const result = service.run('/from/als', () => service.getProjectRoot());
    expect(result).toBe('/from/als');
  });

  it('should throw when run() receives empty string', () => {
    expect(() => service.run('', () => service.getProjectRoot())).toThrow(/Project root is required/);
  });

  it('should throw when run() receives whitespace only', () => {
    expect(() => service.run('   ', () => service.getProjectRoot())).toThrow(/Project root is required/);
  });

  it('should trim project root in run()', () => {
    const result = service.run('  /path/to/project  ', () => {
      return service.getProjectRoot();
    });
    expect(result).toBe('/path/to/project');
  });

  it('should set context for enterWith()', () => {
    service.enterWith('/stdio/project');
    expect(service.getProjectRoot()).toBe('/stdio/project');
  });

  it('should throw when enterWith receives empty string', () => {
    expect(() => service.enterWith('')).toThrow(/Project root is required/);
  });
});
