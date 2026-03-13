import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EntitySchemaTool } from '@/mcp/feature/tools/entity-schema.tool';
import { EntityIntrospectorService } from '@/mcp/data-access/services/entity-introspector.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';
import { ProjectRootContextService } from '@/mcp/data-access/services/project-root-context.service';
import { createEntitySchema } from '../../helpers/mock-data';

describe('EntitySchemaTool', () => {
  let sut: EntitySchemaTool;
  let entityIntrospector: jest.Mocked<EntityIntrospectorService>;

  beforeEach(async () => {
    entityIntrospector = {
      getEntitySchema: jest.fn(),
    } as unknown as jest.Mocked<EntityIntrospectorService>;

    const projectRootContext = {
      run: jest.fn((root: string, fn: () => unknown) => fn()),
    } as unknown as jest.Mocked<ProjectRootContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitySchemaTool,
        { provide: EntityIntrospectorService, useValue: entityIntrospector },
        { provide: McpLoggerService, useValue: { logToolInvoked: jest.fn(), logToolResult: jest.fn() } },
        { provide: ProjectRootContextService, useValue: projectRootContext },
      ],
    }).compile();

    sut = module.get(EntitySchemaTool);
  });

  it('should return not found when entity does not exist', async () => {
    entityIntrospector.getEntitySchema.mockResolvedValue(null);

    const result = await sut.getEntitySchema({ entityName: 'Unknown' });

    expect(result).toBe('Entity "Unknown" not found.');
  });

  it('should return markdown with entity schema', async () => {
    entityIntrospector.getEntitySchema.mockResolvedValue(
      createEntitySchema({
        filePath: 'src/user/data-access/entities/user.entity.ts',
      }),
    );

    const result = await sut.getEntitySchema({ entityName: 'User' });

    expect(result).toContain('# Entity: User');
    expect(result).toContain('user.entity.ts');
    expect(result).toContain('Table: `user`');
    expect(result).toContain('| Name | Type | Nullable | Unique |');
    expect(result).toContain('id');
    expect(result).toContain('## Relations');
    expect(result).toContain('tenant');
    expect(result).toContain('Tenant');
  });

  it('should pass orm override when provided', async () => {
    entityIntrospector.getEntitySchema.mockResolvedValue(
      createEntitySchema({ filePath: 'src/user/user.entity.ts' }),
    );

    await sut.getEntitySchema({ entityName: 'User', orm: 'typeorm' });

    expect(entityIntrospector.getEntitySchema).toHaveBeenCalledWith(
      'User',
      'typeorm',
    );
  });

  it('should handle entity without tableName', async () => {
    entityIntrospector.getEntitySchema.mockResolvedValue(
      createEntitySchema({
        name: 'Base',
        filePath: 'src/shared/base.entity.ts',
        tableName: null,
        properties: [],
        relations: [],
      }),
    );

    const result = await sut.getEntitySchema({ entityName: 'Base' });

    expect(result).toContain('# Entity: Base');
    expect(result).not.toContain('Table:');
  });
});
