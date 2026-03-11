import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ArchitectureResource } from '@/mcp/feature/resources/architecture.resource';
import { DocumentationReaderService } from '@/mcp/data-access/services/documentation-reader.service';

describe('ArchitectureResource', () => {
  let sut: ArchitectureResource;
  let docReader: jest.Mocked<DocumentationReaderService>;

  beforeEach(async () => {
    docReader = {
      getApiOverview: jest.fn(),
    } as unknown as jest.Mocked<DocumentationReaderService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArchitectureResource,
        { provide: DocumentationReaderService, useValue: docReader },
      ],
    }).compile();

    sut = module.get(ArchitectureResource);
  });

  it('should return API overview content', async () => {
    docReader.getApiOverview.mockResolvedValue('# API Overview');

    const result = await sut.getArchitecture();

    expect(result).toBe('# API Overview');
  });

  it('should return fallback when documentation not found', async () => {
    docReader.getApiOverview.mockResolvedValue(null);

    const result = await sut.getArchitecture();

    expect(result).toContain('# Architecture');
    expect(result).toContain('Documentation not found');
  });
});
