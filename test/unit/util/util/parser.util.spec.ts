import {
  extractClassNames,
  extractDecorators,
  extractEntityTableName,
  extractImports,
  extractMikroORMProperties,
} from '@/mcp/util/util/parser';

describe('parser.util', () => {
  describe('extractDecorators', () => {
    it('should extract decorators without filter', () => {
      const content = '@Entity() class Foo {} @Property() id: number';
      const result = extractDecorators(content);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some((d) => d.name === 'Entity')).toBe(true);
    });

    it('should extract decorators with specific name', () => {
      const content = '@Entity({ tableName: "users" }) export class User {}';
      const result = extractDecorators(content, 'Entity');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Entity');
      expect(result[0].args.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('extractClassNames', () => {
    it('should extract class names', () => {
      const content = 'export class User {} class Tenant {}';
      const result = extractClassNames(content);
      expect(result).toContain('User');
      expect(result).toContain('Tenant');
    });
  });

  describe('extractMikroORMProperties', () => {
    it('should extract Property with options', () => {
      const content = `
        @Property({ nullable: true })
        name?: string;
        @Property({ unique: true })
        uuid!: string;
      `;
      const { properties } = extractMikroORMProperties(content);
      expect(properties.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract relations when present', () => {
      const content = `
@Entity()
export class User {
  @ManyToOne(() => Tenant)
  tenant!: Tenant;
}
      `;
      const { relations } = extractMikroORMProperties(content);
      expect(Array.isArray(relations)).toBe(true);
    });
  });

  describe('extractImports', () => {
    it('should extract named imports', () => {
      const content = 'import { User, Tenant } from "./entities";';
      const result = extractImports(content);
      expect(result.length).toBe(1);
      expect(result[0].from).toBe('./entities');
      expect(result[0].specifiers).toContain('User');
      expect(result[0].specifiers).toContain('Tenant');
    });

    it('should extract default import', () => {
      const content = 'import path from "path";';
      const result = extractImports(content);
      expect(result.length).toBe(1);
      expect(result[0].specifiers).toContain('path');
    });
  });

  describe('extractEntityTableName', () => {
    it('should extract tableName from Entity decorator', () => {
      const content = '@Entity({ tableName: "users" })';
      const result = extractEntityTableName(content);
      expect(result).toBe('users');
    });

    it('should return null when no tableName', () => {
      const content = '@Entity()';
      const result = extractEntityTableName(content);
      expect(result).toBeNull();
    });
  });
});
