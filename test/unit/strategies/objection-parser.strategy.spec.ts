import { ObjectionParserStrategy } from '@/mcp/domain/nestjs/data-access/strategies';

describe('ObjectionParserStrategy', () => {
  let sut: ObjectionParserStrategy;

  beforeEach(() => {
    sut = new ObjectionParserStrategy();
  });

  it('should have orm objection', () => {
    expect(sut.orm).toBe('objection');
  });

  it('should canParse when extends Model', () => {
    const content = `
export class User extends Model {
  static tableName = 'users';
}
`;
    expect(sut.canParse(content)).toBe(true);
  });

  it('should not canParse when no Model', () => {
    expect(sut.canParse('class Foo {}')).toBe(false);
  });

  it('should extract tableName from static tableName', () => {
    const content = "static tableName = 'users';";
    expect(sut.extractTableName(content)).toBe('users');
  });

  it('should extract entity class name', () => {
    const content = `
export class User extends Model {
  static tableName = 'users';
}
`;
    expect(sut.extractEntityClass(content)).toBe('User');
  });

  it('should parse relationMappings', () => {
    const content = `
export class Person extends Model {
  static tableName = 'persons';
  static relationMappings = {
    animals: {
      relation: Model.HasManyRelation,
      modelClass: Animal,
      join: {
        from: 'persons.id',
        to: 'animals.ownerId'
      }
    }
  };
}
`;
    const { relations } = sut.parse(content);
    expect(relations.some((r) => r.name === 'animals' && r.type === 'OneToMany')).toBe(true);
    expect(relations.some((r) => r.targetEntity === 'Animal')).toBe(true);
  });

  it('should parse declare properties', () => {
    const content = `
export class User extends Model {
  static tableName = 'users';
  declare id: number;
  declare name: string;
}
`;
    const { properties } = sut.parse(content);
    expect(properties.some((p) => p.name === 'id')).toBe(true);
    expect(properties.some((p) => p.name === 'name')).toBe(true);
  });
});
