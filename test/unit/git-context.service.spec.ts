import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { GitContextService } from '@/mcp/data-access/services/git-context.service';

describe('GitContextService', () => {
  let sut: GitContextService;

  beforeEach(async () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const configService = {
      getOrThrow: jest.fn().mockReturnValue(projectRoot),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitContextService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    sut = module.get(GitContextService);
  });

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

  it('should return module-specific commits when filtering by path', async () => {
    const result = await sut.getModuleChanges('mcp', 365);

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('hash');
      expect(result[0]).toHaveProperty('files');
    }
  });

  it('should return diff output', async () => {
    const result = await sut.getDiff();

    expect(typeof result).toBe('string');
  });

  it('should return diff for specific ref when provided', async () => {
    const result = await sut.getDiff('HEAD~1');

    expect(typeof result).toBe('string');
  });

  it('should return empty array when project root is invalid', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('/nonexistent/path/12345'),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitContextService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    const serviceWithInvalidPath = module.get(GitContextService);
    const result = await serviceWithInvalidPath.getRecentCommits(7);

    expect(result).toEqual([]);
  });

  it('should return tags as array', async () => {
    const result = await sut.getTags();

    expect(Array.isArray(result)).toBe(true);
    result.forEach((tag) => expect(typeof tag).toBe('string'));
  });

  it('should return tags in ascending order when requested', async () => {
    const desc = await sut.getTags('desc');
    const asc = await sut.getTags('asc');

    expect(Array.isArray(desc)).toBe(true);
    expect(Array.isArray(asc)).toBe(true);
    expect([...asc].reverse()).toEqual(desc);
  });

  it('should return commits between refs', async () => {
    const result = await sut.getCommitsBetween('HEAD~2', 'HEAD');

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toMatchObject({
        hash: expect.any(String),
        author: expect.any(String),
        date: expect.any(String),
        message: expect.any(String),
        files: expect.any(Array),
      });
    }
  });

  it('should return all commits when no refs provided', async () => {
    const result = await sut.getCommitsBetween();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return tag date when tag exists', async () => {
    const tags = await sut.getTags();
    if (tags.length > 0) {
      const date = await sut.getTagDate(tags[0]);
      expect(date === null || /^\d{4}-\d{2}-\d{2}$/.test(date)).toBe(true);
    }
  });

  it('should return null for non-existent tag date', async () => {
    const date = await sut.getTagDate('non-existent-tag-xyz-123');
    expect(date).toBeNull();
  });
});
