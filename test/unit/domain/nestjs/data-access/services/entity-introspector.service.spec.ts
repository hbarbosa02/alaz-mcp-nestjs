import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EntityIntrospectorService } from '@/mcp/domain/nestjs/data-access/services/entity-introspector.service';
import { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';
import {
  ENTITY_PARSER_STRATEGIES,
  MikroORMParserStrategy,
  ObjectionParserStrategy,
  TypeORMParserStrategy,
} from '@/mcp/domain/nestjs/data-access/strategies';
import { createProjectContext } from '@test/helpers/mock-data';

const sampleEntityContent = `
@Entity({ tableName: 'users' })
export class User {
  @Property()
  uuid!: string;

  @Property({ nullable: true })
  username?: string;

  @ManyToOne(() => Tenant)
  tenant!: Tenant;
}
`;

describe('EntityIntrospectorService', () => {
  let sut: EntityIntrospectorService;
  let fileReader: jest.Mocked<FileReaderService>;
  let projectContext: jest.Mocked<ProjectContextService>;

  beforeEach(async () => {
    fileReader = {
      readGlob: jest.fn(),
      readFile: jest.fn(),
    } as unknown as jest.Mocked<FileReaderService>;

    projectContext = {
      getContext: jest
        .fn()
        .mockResolvedValue(createProjectContext({ orm: 'mikroorm' })),
    } as unknown as jest.Mocked<ProjectContextService>;

    const strategies = [
      new MikroORMParserStrategy(),
      new TypeORMParserStrategy(),
      new ObjectionParserStrategy(),
    ];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntityIntrospectorService,
        { provide: FileReaderService, useValue: fileReader },
        { provide: ProjectContextService, useValue: projectContext },
        { provide: ENTITY_PARSER_STRATEGIES, useValue: strategies },
      ],
    }).compile();

    sut = module.get(EntityIntrospectorService);
  });

  it('should return null for unknown entity', async () => {
    fileReader.readGlob.mockResolvedValue([]);
    const result = await sut.getEntitySchema('UnknownEntity');
    expect(result).toBeNull();
  });

  it('should parse entity from file content', async () => {
    fileReader.readGlob.mockResolvedValue(['src/user/user.entity.ts']);
    fileReader.readFile.mockResolvedValue(sampleEntityContent);

    const result = await sut.getEntitySchema('User');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('User');
    expect(result?.tableName).toBe('users');
    expect(result?.properties.length).toBeGreaterThanOrEqual(1);
  });

  it('should skip files with empty content in getEntitySchema', async () => {
    fileReader.readGlob.mockResolvedValue([
      'src/user/user.entity.ts',
      'src/tenant/tenant.entity.ts',
    ]);
    fileReader.readFile
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(sampleEntityContent);

    const result = await sut.getEntitySchema('User');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('User');
  });

  it('should skip files when classNames does not include entity', async () => {
    const otherEntityContent = `
@Entity({ tableName: 'tenants' })
export class Tenant {
  @Property()
  uuid!: string;
}
`;
    fileReader.readGlob.mockResolvedValue([
      'src/user/user.entity.ts',
      'src/tenant/tenant.entity.ts',
    ]);
    fileReader.readFile
      .mockResolvedValueOnce(otherEntityContent)
      .mockResolvedValueOnce(sampleEntityContent);

    const result = await sut.getEntitySchema('User');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('User');
  });

  it('should list entities from multiple files', async () => {
    const tenantContent = `
@Entity({ tableName: 'tenants' })
export class Tenant {
  @Property()
  uuid!: string;
}
`;
    fileReader.readGlob.mockResolvedValue([
      'src/user/user.entity.ts',
      'src/tenant/tenant.entity.ts',
    ]);
    fileReader.readFile
      .mockResolvedValueOnce(sampleEntityContent)
      .mockResolvedValueOnce(tenantContent);

    const result = await sut.listEntities();
    expect(result.length).toBe(2);
    expect(result.map((s) => s.name)).toContain('User');
    expect(result.map((s) => s.name)).toContain('Tenant');
  });

  it('should skip files with empty content in listEntities', async () => {
    fileReader.readGlob.mockResolvedValue([
      'src/user/user.entity.ts',
      'src/tenant/tenant.entity.ts',
    ]);
    fileReader.readFile
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(sampleEntityContent);

    const result = await sut.listEntities();
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('User');
  });
});
