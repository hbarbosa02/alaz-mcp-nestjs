import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ArchitectureResource } from '@/mcp/domain/nestjs/feature/resources/architecture.resource';
import { DocumentationReaderService } from '@/mcp/domain/nestjs/data-access/services/documentation-reader.service';
import { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { createProjectContext } from '../../helpers/mock-data';

describe('ArchitectureResource', () => {
  let sut: ArchitectureResource;
  let docReader: jest.Mocked<DocumentationReaderService>;

  beforeEach(async () => {
    docReader = {
      getApiOverview: jest.fn(),
    } as unknown as jest.Mocked<DocumentationReaderService>;

    const projectContext = {
      getContext: jest.fn().mockResolvedValue(
        createProjectContext({
          docsLayout: {
            features: 'docs/features/',
            architecture: 'docs/architecture/',
            changelog: 'docs/changes/4 - Changelog.md',
            conventions: 'docs/api/API-CONVENTIONS.md',
            testing: 'docs/tests/README-TESTS.md',
            entities: 'docs/diagrams/DATABASE-ENTITIES.md',
            apiOverview: 'docs/architecture/API-OVERVIEW.md',
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArchitectureResource,
        { provide: DocumentationReaderService, useValue: docReader },
        { provide: ProjectContextService, useValue: projectContext },
        { provide: McpLoggerService, useValue: { logResourceRead: jest.fn(), logResourceResult: jest.fn() } },
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
