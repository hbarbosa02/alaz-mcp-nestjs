import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { RecentChangesTool } from '@/mcp/feature/tools/recent-changes.tool';
import { GitContextService } from '@/mcp/data-access/services/git-context.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

describe('RecentChangesTool', () => {
  let sut: RecentChangesTool;
  let gitContext: jest.Mocked<GitContextService>;

  beforeEach(async () => {
    gitContext = {
      getRecentCommits: jest.fn(),
    } as unknown as jest.Mocked<GitContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecentChangesTool,
        { provide: GitContextService, useValue: gitContext },
        { provide: McpLoggerService, useValue: { logToolInvoked: jest.fn(), logToolResult: jest.fn() } },
      ],
    }).compile();

    sut = module.get(RecentChangesTool);
  });

  it('should return message when no commits', async () => {
    gitContext.getRecentCommits.mockResolvedValue([]);

    const result = await sut.getRecentChanges({ days: 7 });

    expect(result).toBe('No commits in the last 7 days.');
  });

  it('should return formatted commits', async () => {
    gitContext.getRecentCommits.mockResolvedValue([
      {
        hash: 'abc1234',
        message: 'feat: add user',
        author: 'dev@example.com',
        date: '2025-03-11',
        files: ['src/user/user.service.ts'],
      },
    ]);

    const result = await sut.getRecentChanges({ days: 7 });

    expect(result).toContain('# Commits (last 7 days)');
    expect(result).toContain('abc1234');
    expect(result).toContain('feat: add user');
    expect(result).toContain('dev@example.com');
    expect(result).toContain('2025-03-11');
    expect(result).toContain('user.service.ts');
  });

  it('should truncate files list when more than 5', async () => {
    gitContext.getRecentCommits.mockResolvedValue([
      {
        hash: 'abc1234',
        message: 'fix',
        author: 'a',
        date: '2025-03-11',
        files: ['a', 'b', 'c', 'd', 'e', 'f'],
      },
    ]);

    const result = await sut.getRecentChanges({ days: 7 });

    expect(result).toContain('...');
  });
});
