import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ChangelogResource } from '@/mcp/domain/shared/feature/resources/changelog.resource';
import { DocumentationReaderService } from '@/mcp/domain/nestjs/data-access/services/documentation-reader.service';
import { GitChangelogService } from '@/mcp/core/data-access/services/git-changelog.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';

describe('ChangelogResource', () => {
  let sut: ChangelogResource;
  let gitChangelog: jest.Mocked<GitChangelogService>;
  let docReader: jest.Mocked<DocumentationReaderService>;

  beforeEach(async () => {
    gitChangelog = {
      generateChangelog: jest.fn(),
    } as unknown as jest.Mocked<GitChangelogService>;
    docReader = {
      getChangelog: jest.fn(),
    } as unknown as jest.Mocked<DocumentationReaderService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangelogResource,
        { provide: GitChangelogService, useValue: gitChangelog },
        { provide: DocumentationReaderService, useValue: docReader },
        { provide: McpLoggerService, useValue: { logResourceRead: jest.fn(), logResourceResult: jest.fn() } },
      ],
    }).compile();

    sut = module.get(ChangelogResource);
  });

  it('should return Git changelog when available', async () => {
    gitChangelog.generateChangelog.mockResolvedValue('# Changelog\n\n## [Unreleased]');
    docReader.getChangelog.mockResolvedValue('# Static Changelog');

    const result = await sut.getChangelog();

    expect(result).toContain('[Unreleased]');
    expect(docReader.getChangelog).not.toHaveBeenCalled();
  });

  it('should fallback to static docs when Git changelog is null', async () => {
    gitChangelog.generateChangelog.mockResolvedValue(null);
    docReader.getChangelog.mockResolvedValue('# Static Changelog');

    const result = await sut.getChangelog();

    expect(result).toBe('# Static Changelog');
  });

  it('should fallback to static docs when Git changelog is empty', async () => {
    gitChangelog.generateChangelog.mockResolvedValue('');
    docReader.getChangelog.mockResolvedValue('# Static Changelog');

    const result = await sut.getChangelog();

    expect(result).toBe('# Static Changelog');
  });

  it('should return fallback message when both sources are empty', async () => {
    gitChangelog.generateChangelog.mockResolvedValue(null);
    docReader.getChangelog.mockResolvedValue(null);

    const result = await sut.getChangelog();

    expect(result).toContain('# Changelog');
    expect(result).toContain('Documentation not found');
  });
});
