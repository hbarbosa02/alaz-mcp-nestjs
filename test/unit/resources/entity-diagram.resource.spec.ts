import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EntityDiagramResource } from '@/mcp/domain/nestjs/feature/resources/entity-diagram.resource';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import {
  createEntitySchema,
  createFrameworkAdapterMocks,
} from '../../helpers/mock-data';

describe('EntityDiagramResource', () => {
  let sut: EntityDiagramResource;
  let entityIntrospector: { getEntitySchema: jest.Mock };
  let mocks: ReturnType<typeof createFrameworkAdapterMocks>;

  beforeEach(async () => {
    entityIntrospector = { getEntitySchema: jest.fn() };

    mocks = createFrameworkAdapterMocks({
      entityIntrospector,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntityDiagramResource,
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

    sut = module.get(EntityDiagramResource);
  });

  it('should return not found when entity does not exist', async () => {
    entityIntrospector.getEntitySchema.mockResolvedValue(null);

    const result = (await sut.getEntityDiagram({
      entityName: 'Unknown',
    })) as { contents: { text: string }[] };

    expect(result.contents[0].text).toBe('Entity "Unknown" not found.');
  });

  it('should return entity schema with mermaid diagram', async () => {
    entityIntrospector.getEntitySchema.mockResolvedValue(createEntitySchema());

    const result = (await sut.getEntityDiagram({
      entityName: 'User',
    })) as { contents: { text: string }[] };

    const text = result.contents[0].text;
    expect(text).toContain('# Entity: User');
    expect(text).toContain('## Properties');
    expect(text).toContain('## Relations');
    expect(text).toContain('## ER Diagram (Mermaid)');
    expect(text).toContain('```mermaid');
    expect(text).toContain('erDiagram');
  });

  it('should handle OneToMany relation in mermaid diagram', async () => {
    entityIntrospector.getEntitySchema.mockResolvedValue(
      createEntitySchema({
        relations: [
          {
            name: 'accounts',
            type: 'OneToMany',
            targetEntity: 'Account',
            inversedBy: undefined,
            mappedBy: undefined,
          },
        ],
      }),
    );

    const result = (await sut.getEntityDiagram({
      entityName: 'User',
    })) as { contents: { text: string }[] };

    expect(result.contents[0].text).toContain('||o{');
  });

  it('should handle entity without relations', async () => {
    entityIntrospector.getEntitySchema.mockResolvedValue(
      createEntitySchema({ relations: [] }),
    );

    const result = (await sut.getEntityDiagram({
      entityName: 'User',
    })) as { contents: { text: string }[] };

    const text = result.contents[0].text;
    expect(text).toContain('# Entity: User');
    expect(text).not.toContain('## Relations');
  });
});
