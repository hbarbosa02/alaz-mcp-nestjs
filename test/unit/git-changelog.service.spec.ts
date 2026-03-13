import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { GitChangelogService } from '@/mcp/core/data-access/services/git-changelog.service';
import { GitContextService } from '@/mcp/core/data-access/services/git-context.service';

describe('GitChangelogService', () => {
  let sut: GitChangelogService;
  let gitContext: jest.Mocked<GitContextService>;

  beforeEach(async () => {
    gitContext = {
      getTags: jest.fn(),
      getCommitsBetween: jest.fn(),
      getTagDate: jest.fn(),
    } as unknown as jest.Mocked<GitContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitChangelogService,
        { provide: GitContextService, useValue: gitContext },
      ],
    }).compile();

    sut = module.get(GitChangelogService);
  });

  it('should generate changelog with Unreleased when no tags', async () => {
    gitContext.getTags.mockResolvedValue([]);
    gitContext.getCommitsBetween.mockResolvedValue([
      {
        hash: 'abc123',
        author: 'Dev',
        date: '2025-03-12',
        message: 'feat: add feature',
        files: ['src/foo.ts'],
      },
    ]);

    const result = await sut.generateChangelog();

    expect(result).toContain('# Changelog');
    expect(result).toContain('## [Unreleased]');
    expect(result).toContain('add feature');
    expect(result).toContain('### Added');
  });

  it('should generate changelog with versioned sections when tags exist', async () => {
    gitContext.getTags.mockResolvedValue(['v1.0.0', 'v1.1.0']);
    gitContext.getCommitsBetween
      .mockResolvedValueOnce([
        {
          hash: 'c2',
          author: 'Dev',
          date: '2025-03-12',
          message: 'feat: unreleased change',
          files: [],
        },
      ])
      .mockResolvedValueOnce([
        {
          hash: 'c1',
          author: 'Dev',
          date: '2025-03-10',
          message: 'fix: bug in v1.1.0',
          files: [],
        },
      ])
      .mockResolvedValueOnce([
        {
          hash: 'c0',
          author: 'Dev',
          date: '2025-01-01',
          message: 'Initial commit',
          files: [],
        },
      ]);
    gitContext.getTagDate.mockResolvedValue('2025-03-10');

    const result = await sut.generateChangelog();

    expect(result).toContain('# Changelog');
    expect(result).toContain('## [Unreleased]');
    expect(result).toContain('unreleased change');
    expect(result).toContain('## [v1.1.0] - 2025-03-10');
    expect(result).toContain('bug in v1.1.0');
    expect(result).toContain('## [v1.0.0]');
    expect(result).toContain('Initial commit');
  });

  it('should categorize commits by Conventional Commits', async () => {
    gitContext.getTags.mockResolvedValue([]);
    gitContext.getCommitsBetween.mockResolvedValue([
      { hash: '1', author: 'A', date: '2025-01-01', message: 'feat: new feature', files: [] },
      { hash: '2', author: 'A', date: '2025-01-02', message: 'fix: bug fix', files: [] },
      { hash: '3', author: 'A', date: '2025-01-03', message: 'docs: update readme', files: [] },
    ]);

    const result = await sut.generateChangelog();

    expect(result).toContain('### Added');
    expect(result).toContain('new feature');
    expect(result).toContain('### Fixed');
    expect(result).toContain('bug fix');
    expect(result).toContain('### Documentation');
    expect(result).toContain('update readme');
  });

  it('should return null when Git fails', async () => {
    gitContext.getTags.mockRejectedValue(new Error('git failed'));

    const result = await sut.generateChangelog();

    expect(result).toBeNull();
  });

  it('should skip Unreleased section when no commits since last tag', async () => {
    gitContext.getTags.mockResolvedValue(['v1.0.0']);
    gitContext.getCommitsBetween
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          hash: 'c0',
          author: 'Dev',
          date: '2025-01-01',
          message: 'Initial commit',
          files: [],
        },
      ]);
    gitContext.getTagDate.mockResolvedValue('2025-01-01');

    const result = await sut.generateChangelog();

    expect(result).not.toContain('[Unreleased]');
    expect(result).toContain('## [v1.0.0] - 2025-01-01');
    expect(result).toContain('Initial commit');
  });
});
