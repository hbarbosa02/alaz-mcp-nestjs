import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ChangelogResource } from '@/mcp/domain/shared/feature/resources/changelog.resource';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { GitChangelogService } from '@/mcp/core/data-access/services/git-changelog.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { createFrameworkAdapterMocks } from '../../helpers/mock-data';

describe('ChangelogResource', () => {
  let sut: ChangelogResource;
  let gitChangelog: { generateChangelog: jest.Mock };
  let docReader: { getChangelog: jest.Mock };
  let mocks: ReturnType<typeof createFrameworkAdapterMocks>;

  beforeEach(async () => {
    gitChangelog = { generateChangelog: jest.fn() };
    docReader = { getChangelog: jest.fn() };

    mocks = createFrameworkAdapterMocks({
      documentationReader: docReader,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangelogResource,
        {
          provide: FrameworkDetectorService,
          useValue: mocks.frameworkDetector,
        },
        {
          provide: FrameworkAdapterRegistryService,
          useValue: mocks.adapterRegistry,
        },
        { provide: GitChangelogService, useValue: gitChangelog },
        {
          provide: McpLoggerService,
          useValue: {
            logResourceRead: jest.fn(),
            logResourceResult: jest.fn(),
          },
        },
      ],
    }).compile();

    sut = module.get(ChangelogResource);
  });

  it('should return Git changelog when available', async () => {
    gitChangelog.generateChangelog.mockResolvedValue(
      '# Changelog\n\n## [Unreleased]',
    );
    docReader.getChangelog.mockResolvedValue('# Static Changelog');

    const result = await sut.getChangelog();

    expect((result.contents[0] as { text: string }).text).toContain(
      '[Unreleased]',
    );
    expect(docReader.getChangelog).not.toHaveBeenCalled();
  });

  it('should fallback to static docs when Git changelog is null', async () => {
    gitChangelog.generateChangelog.mockResolvedValue(null);
    docReader.getChangelog.mockResolvedValue('# Static Changelog');

    const result = await sut.getChangelog();

    expect((result.contents[0] as { text: string }).text).toBe(
      '# Static Changelog',
    );
  });

  it('should fallback to static docs when Git changelog is empty', async () => {
    gitChangelog.generateChangelog.mockResolvedValue('');
    docReader.getChangelog.mockResolvedValue('# Static Changelog');

    const result = await sut.getChangelog();

    expect((result.contents[0] as { text: string }).text).toBe(
      '# Static Changelog',
    );
  });

  it('should return fallback message when both sources are empty', async () => {
    gitChangelog.generateChangelog.mockResolvedValue(null);
    docReader.getChangelog.mockResolvedValue(null);

    const result = await sut.getChangelog();

    const text = (result.contents[0] as { text: string }).text;
    expect(text).toContain('# Changelog');
    expect(text).toContain('Documentation not found');
  });
});
