import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as path from 'path';
import {
  EXEC_FILE_ASYNC,
  GitContextService,
  type ExecFileAsyncFn,
} from '@/mcp/core/data-access/services/git-context.service';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';

describe('GitContextService', () => {
  let sut: GitContextService;
  const projectRoot = path.resolve(__dirname, '../../../../../..');

  async function createModule(execFileOverride?: ExecFileAsyncFn): Promise<TestingModule> {
    const projectRootContext = {
      getProjectRoot: jest.fn().mockReturnValue(projectRoot),
    } as unknown as jest.Mocked<ProjectRootContextService>;

    const providers = [
      GitContextService,
      { provide: ProjectRootContextService, useValue: projectRootContext },
      ...(execFileOverride ? [{ provide: EXEC_FILE_ASYNC, useValue: execFileOverride }] : []),
    ];

    return Test.createTestingModule({ providers }).compile();
  }

  beforeEach(async () => {
    const module = await createModule();
    sut = module.get(GitContextService);
  });

  describe('getRecentCommits', () => {
    it('should parse git log and return commits', async () => {
      const stdout = [
        'abc123def456789012345678901234567890abcd|||Author|||2024-01-15|||feat: add feature',
        'src/foo.ts',
        'src/bar.ts',
      ].join('\n');

      const execMock = jest.fn().mockResolvedValue({
        stdout,
        stderr: '',
      });

      const module = await createModule(execMock as unknown as ExecFileAsyncFn);
      sut = module.get(GitContextService);

      const result = await sut.getRecentCommits(7);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        hash: 'abc123def456789012345678901234567890abcd',
        author: 'Author',
        date: '2024-01-15',
        message: 'feat: add feature',
        files: ['src/foo.ts', 'src/bar.ts'],
      });
    });

    it('should return empty array when execFile fails', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockRejectedValue(new Error('git failed'));

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getRecentCommits(7);

      expect(result).toEqual([]);
    });
  });

  describe('getModuleChanges', () => {
    it('should parse module-specific commits', async () => {
      const stdout = 'abc123def456789012345678901234567890abcd|||Author|||2024-01-15|||chore: mcp\nsrc/mcp/foo.ts\n';

      const execMock: ExecFileAsyncFn = jest.fn().mockResolvedValue({
        stdout,
        stderr: '',
      });

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getModuleChanges('mcp', 7);

      expect(result).toHaveLength(1);
      expect(result[0].hash).toBe('abc123def456789012345678901234567890abcd');
      expect(result[0].files).toEqual(['src/mcp/foo.ts']);
      expect(execMock).toHaveBeenCalledWith('git', expect.arrayContaining(['src/mcp/']), expect.any(Object));
    });

    it('should return empty array when execFile fails', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockRejectedValue(new Error('git failed'));

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getModuleChanges('mcp', 7);

      expect(result).toEqual([]);
    });
  });

  describe('getDiff', () => {
    it('should return diff output', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockResolvedValue({
        stdout: 'diff --git a/foo b/foo\n',
        stderr: '',
      });

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getDiff();

      expect(result).toBe('diff --git a/foo b/foo\n');
    });

    it('should return diff for specific ref when provided', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockResolvedValue({
        stdout: 'diff output',
        stderr: '',
      });

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getDiff('HEAD~1');

      expect(result).toBe('diff output');
      expect(execMock).toHaveBeenCalledWith('git', ['diff', 'HEAD~1'], expect.any(Object));
    });

    it('should return empty string when execFile fails', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockRejectedValue(new Error('git failed'));

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getDiff();

      expect(result).toBe('');
    });
  });

  describe('getTags', () => {
    it('should return tags as array', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockResolvedValue({
        stdout: 'v1.0.0\nv0.9.0\n',
        stderr: '',
      });

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getTags();

      expect(result).toEqual(['v1.0.0', 'v0.9.0']);
    });

    it('should use version:refname for asc sort', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockResolvedValue({
        stdout: 'v0.9.0\nv1.0.0\n',
        stderr: '',
      });

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      await sut.getTags('asc');

      expect(execMock).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['--sort=version:refname']),
        expect.any(Object),
      );
    });

    it('should use -version:refname for desc sort', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockResolvedValue({
        stdout: 'v1.0.0\nv0.9.0\n',
        stderr: '',
      });

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      await sut.getTags('desc');

      expect(execMock).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['--sort=-version:refname']),
        expect.any(Object),
      );
    });

    it('should return empty array when execFile fails', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockRejectedValue(new Error('git failed'));

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getTags();

      expect(result).toEqual([]);
    });
  });

  describe('getCommitsBetween', () => {
    it('should use fromRef..toRef when both provided', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockResolvedValue({
        stdout: 'abc123def456789012345678901234567890abcd|||A|||2024-01-15|||msg\n',
        stderr: '',
      });

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getCommitsBetween('v1.0', 'v2.0');

      expect(result).toHaveLength(1);
      expect(result[0].hash).toBe('abc123def456789012345678901234567890abcd');
      expect(execMock).toHaveBeenCalledWith('git', expect.arrayContaining(['v1.0..v2.0']), expect.any(Object));
    });

    it('should use toRef only when fromRef undefined', async () => {
      const execMock = jest.fn().mockResolvedValue({
        stdout: 'abc123def456789012345678901234567890abcd|||A|||2024-01-15|||msg\n',
        stderr: '',
      });

      const module = await createModule(execMock as unknown as ExecFileAsyncFn);
      sut = module.get(GitContextService);

      await sut.getCommitsBetween(undefined, 'v2.0');

      expect(execMock).toHaveBeenCalledWith('git', expect.arrayContaining(['v2.0']), expect.any(Object));
    });

    it('should use fromRef..HEAD when toRef undefined', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockResolvedValue({
        stdout: 'abc123def456789012345678901234567890abcd|||A|||2024-01-15|||msg\n',
        stderr: '',
      });

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      await sut.getCommitsBetween('v1.0');

      expect(execMock).toHaveBeenCalledWith('git', expect.arrayContaining(['v1.0..HEAD']), expect.any(Object));
    });

    it('should return empty array when execFile fails', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockRejectedValue(new Error('git failed'));

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getCommitsBetween('v1', 'v2');

      expect(result).toEqual([]);
    });
  });

  describe('getTagDate', () => {
    it('should return date when tag exists', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockResolvedValue({
        stdout: '2024-01-15\n',
        stderr: '',
      });

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getTagDate('v1.0.0');

      expect(result).toBe('2024-01-15');
    });

    it('should return null when stdout is empty', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getTagDate('non-existent-tag');

      expect(result).toBeNull();
    });

    it('should return null when execFile fails', async () => {
      const execMock: ExecFileAsyncFn = jest.fn().mockRejectedValue(new Error('git failed'));

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getTagDate('v1.0.0');

      expect(result).toBeNull();
    });
  });

  describe('parseGitLog edge cases', () => {
    it('should handle commit with empty files', async () => {
      const stdout = 'abc123def456789012345678901234567890abcd|||Author|||2024-01-15|||msg\n';

      const execMock: ExecFileAsyncFn = jest.fn().mockResolvedValue({
        stdout,
        stderr: '',
      });

      const module = await createModule(execMock);
      sut = module.get(GitContextService);

      const result = await sut.getRecentCommits(7);

      expect(result).toHaveLength(1);
      expect(result[0].files).toEqual([]);
    });

    it('should return empty array when no commits', async () => {
      const execMock = jest.fn().mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      const module = await createModule(execMock as unknown as ExecFileAsyncFn);
      sut = module.get(GitContextService);

      const result = await sut.getRecentCommits(7);

      expect(result).toEqual([]);
    });
  });

  describe('real git integration', () => {
    it('should return recent commits from real git repo', async () => {
      const result = await sut.getRecentCommits(365);

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toMatchObject({
          hash: expect.any(String),
          author: expect.any(String),
          date: expect.any(String),
          message: expect.any(String),
          files: expect.any(Array),
        });
        expect(result[0].hash).toMatch(/^[a-f0-9]{40}$/);
      }
    });

    it('should return diff output', async () => {
      const result = await sut.getDiff();

      expect(typeof result).toBe('string');
    });

    it('should return tags as array', async () => {
      const result = await sut.getTags();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((tag) => expect(typeof tag).toBe('string'));
    });
  });

  describe('invalid project root', () => {
    it('should return empty array when project root is invalid', async () => {
      const projectRootContext = {
        getProjectRoot: jest.fn().mockReturnValue('/nonexistent/path/12345'),
      } as unknown as jest.Mocked<ProjectRootContextService>;

      const execMock: ExecFileAsyncFn = jest.fn().mockRejectedValue(new Error('not a git repo'));

      const module = await Test.createTestingModule({
        providers: [
          GitContextService,
          { provide: ProjectRootContextService, useValue: projectRootContext },
          { provide: EXEC_FILE_ASYNC, useValue: execMock },
        ],
      }).compile();

      const serviceWithInvalidPath = module.get(GitContextService);
      const result = await serviceWithInvalidPath.getRecentCommits(7);

      expect(result).toEqual([]);
    });
  });
});
