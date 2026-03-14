import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';

describe('ProjectRootContextService', () => {
  let service: ProjectRootContextService;

  beforeEach(() => {
    service = new ProjectRootContextService();
  });

  it('should return project root from run()', () => {
    const result = service.run('/path/to/project', () => {
      return service.getProjectRoot();
    });
    expect(result).toBe('/path/to/project');
  });

  it('should throw when getProjectRoot called outside run()', () => {
    expect(() => service.getProjectRoot()).toThrow(/Project root is required/);
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
