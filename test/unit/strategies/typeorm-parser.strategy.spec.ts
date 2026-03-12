import { TypeORMParserStrategy } from '@/mcp/data-access/strategies';

describe('TypeORMParserStrategy', () => {
  let sut: TypeORMParserStrategy;

  beforeEach(() => {
    sut = new TypeORMParserStrategy();
  });

  it('should have orm typeorm', () => {
    expect(sut.orm).toBe('typeorm');
  });

  it('should canParse when @Entity and @Column present', () => {
    const content = `
@Entity()
export class User {
  @Column()
  uuid: string;
}
`;
    expect(sut.canParse(content)).toBe(true);
  });

  it('should not canParse when only @Entity', () => {
    expect(sut.canParse('@Entity() class Foo {}')).toBe(false);
  });

  it('should extract tableName from @Entity("table_name")', () => {
    const content = '@Entity("users")';
    expect(sut.extractTableName(content)).toBe('users');
  });

  it('should extract tableName from @Entity({ name: "table_name" })', () => {
    const content = '@Entity({ name: "users" })';
    expect(sut.extractTableName(content)).toBe('users');
  });

  it('should extract entity class name', () => {
    const content = `
@Entity()
export class User {
  @Column()
  uuid: string;
}
`;
    expect(sut.extractEntityClass(content)).toBe('User');
  });

  it('should parse properties and relations', () => {
    const content = `@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  uuid: string;
  @ManyToOne(() => Tenant)
  tenant: Tenant;
}`;
    const { properties, relations } = sut.parse(content);
    expect(properties.length).toBeGreaterThanOrEqual(2);
    expect(properties.some((p) => p.name === 'uuid')).toBe(true);
    expect(relations.length).toBeGreaterThanOrEqual(1);
    expect(relations.some((r) => r.name === 'tenant' && r.targetEntity === 'Tenant')).toBe(true);
  });
});
