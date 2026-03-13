import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ArchitectureResource } from '@/mcp/domain/nestjs/feature/resources/architecture.resource';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import {
  createProjectContext,
  createFrameworkAdapterMocks,
} from '../../helpers/mock-data';

describe('ArchitectureResource', () => {
  let sut: ArchitectureResource;
  let docReader: { getApiOverview: jest.Mock };
  let mocks: ReturnType<typeof createFrameworkAdapterMocks>;

  beforeEach(async () => {
    docReader = {
      getApiOverview: jest.fn(),
    };

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

    mocks = createFrameworkAdapterMocks({
      documentationReader: docReader,
      projectContext,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArchitectureResource,
        {
          provide: FrameworkDetectorService,
          useValue: mocks.frameworkDetector,
        },
        {
          provide: FrameworkAdapterRegistryService,
          useValue: mocks.adapterRegistry,
        },
        {
          provide: McpLoggerService,
          useValue: {
            logResourceRead: jest.fn(),
            logResourceResult: jest.fn(),
          },
        },
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

  it('should return unsupported message when framework not detected', async () => {
    mocks.frameworkDetector.detect.mockResolvedValue(null);
    mocks.adapterRegistry.getUnsupportedMessage.mockReturnValue(
      'Framework not supported.',
    );

    const result = await sut.getArchitecture();

    expect(result).toBe('Framework not supported.');
  });
});
