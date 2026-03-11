import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ChangelogResource } from '@/mcp/feature/resources/changelog.resource';
import { DocumentationReaderService } from '@/mcp/data-access/services/documentation-reader.service';

describe('ChangelogResource', () => {
  let sut: ChangelogResource;
  let docReader: jest.Mocked<DocumentationReaderService>;

  beforeEach(async () => {
    docReader = {
      getChangelog: jest.fn(),
    } as unknown as jest.Mocked<DocumentationReaderService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangelogResource,
        { provide: DocumentationReaderService, useValue: docReader },
      ],
    }).compile();

    sut = module.get(ChangelogResource);
  });

  it('should return changelog content', async () => {
    docReader.getChangelog.mockResolvedValue('# Changelog');

    const result = await sut.getChangelog();

    expect(result).toBe('# Changelog');
  });

  it('should return fallback when documentation not found', async () => {
    docReader.getChangelog.mockResolvedValue(null);

    const result = await sut.getChangelog();

    expect(result).toContain('# Changelog');
    expect(result).toContain('Documentation not found');
  });
});
