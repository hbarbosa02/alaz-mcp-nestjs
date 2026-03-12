import { MikroORMParserStrategy } from '@/mcp/data-access/strategies';

describe('MikroORMParserStrategy', () => {
  let sut: MikroORMParserStrategy;

  beforeEach(() => {
    sut = new MikroORMParserStrategy();
  });

  it('should have orm mikroorm', () => {
    expect(sut.orm).toBe('mikroorm');
  });

  it('should canParse when @Entity and @Property present', () => {
    const content = `
@Entity({ tableName: 'users' })
export class User {
  @Property()
  uuid!: string;
}
`;
    expect(sut.canParse(content)).toBe(true);
  });

  it('should not canParse when only @Entity', () => {
    expect(sut.canParse('@Entity() class Foo {}')).toBe(false);
  });

  it('should extract tableName from @Entity', () => {
    const content = "@Entity({ tableName: 'users' })";
    expect(sut.extractTableName(content)).toBe('users');
  });

  it('should extract entity class name', () => {
    const content = `
@Entity()
export class User {
  @Property()
  uuid!: string;
}
`;
    expect(sut.extractEntityClass(content)).toBe('User');
  });

  it('should parse properties and relations', () => {
    const content = `@Entity({ tableName: 'users' })
export class User {
  @Property({ nullable: true })
  name?: string;
  @Property({ unique: true })
  uuid!: string;
  @ManyToOne(() => Tenant)
  tenant!: Tenant;
}`;
    const { properties, relations } = sut.parse(content);
    expect(properties.length).toBeGreaterThanOrEqual(1);
    expect(relations.length).toBeGreaterThanOrEqual(1);
    expect(properties.map((p) => p.name)).toContain('uuid');
    expect(relations.map((r) => r.name)).toContain('tenant');
    expect(relations.map((r) => r.targetEntity)).toContain('Tenant');
  });
});
