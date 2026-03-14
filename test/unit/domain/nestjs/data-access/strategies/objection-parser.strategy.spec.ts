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

  it('should extract tableName from getter', () => {
    const content = `
export class User extends Model {
  static get tableName() { return 'users'; }
}
`;
    expect(sut.extractTableName(content)).toBe('users');
  });

  it('should return null when tableName not found', () => {
    expect(sut.extractTableName('class Foo extends Model {}')).toBeNull();
  });

  it('should parse BelongsToOneRelation', () => {
    const content = `
export class Post extends Model {
  static tableName = 'posts';
  static relationMappings = {
    author: {
      relation: Model.BelongsToOneRelation,
      modelClass: User
    }
  };
}
`;
    const { relations } = sut.parse(content);
    expect(relations.some((r) => r.name === 'author' && r.type === 'ManyToOne')).toBe(true);
  });

  it('should parse ManyToManyRelation', () => {
    const content = `
export class User extends Model {
  static tableName = 'users';
  static relationMappings = {
    roles: {
      relation: Model.ManyToManyRelation,
      modelClass: Role
    }
  };
}
`;
    const { relations } = sut.parse(content);
    expect(relations.some((r) => r.name === 'roles' && r.type === 'ManyToMany')).toBe(true);
  });

  it('should parse HasOneRelation', () => {
    const content = `
export class User extends Model {
  static tableName = 'users';
  static relationMappings = {
    profile: {
      relation: Model.HasOneRelation,
      modelClass: Profile
    }
  };
}
`;
    const { relations } = sut.parse(content);
    expect(relations.some((r) => r.name === 'profile' && r.type === 'OneToOne')).toBe(true);
  });

  it('should parse relation with modelClass from require', () => {
    const content = `
export class Post extends Model {
  static tableName = 'posts';
  static relationMappings = {
    author: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => require('./user.model').User
    }
  };
}
`;
    const { relations } = sut.parse(content);
    expect(relations.some((r) => r.name === 'author')).toBe(true);
    const authorRel = relations.find((r) => r.name === 'author');
    expect(authorRel?.targetEntity).toBeDefined();
  });

  it('should skip declare properties for relationMappings, tableName, idColumn', () => {
    const content = `
export class User extends Model {
  static tableName = 'users';
  declare relationMappings: any;
  declare tableName: string;
  declare idColumn: string;
  declare name: string;
}
`;
    const { properties } = sut.parse(content);
    expect(properties.some((p) => p.name === 'relationMappings')).toBe(false);
    expect(properties.some((p) => p.name === 'tableName')).toBe(false);
    expect(properties.some((p) => p.name === 'idColumn')).toBe(false);
    expect(properties.some((p) => p.name === 'name')).toBe(true);
  });
});
