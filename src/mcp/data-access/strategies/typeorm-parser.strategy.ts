import { Injectable } from '@nestjs/common';
import { extractClassNames } from '@/mcp/util/util/parser';
import type {
  EntityParserStrategy,
  OrmType,
  ParsedProperty,
  ParsedRelation,
} from './entity-parser.strategy';

@Injectable()
export class TypeORMParserStrategy implements EntityParserStrategy {
  readonly orm: OrmType = 'typeorm';

  canParse(content: string): boolean {
    return content.includes('@Entity') && content.includes('@Column');
  }

  extractTableName(content: string): string | null {
    // @Entity("table_name")
    const stringArg = content.match(/@Entity\s*\(\s*["']([^"']+)["']\s*\)/);
    if (stringArg) return stringArg[1];

    // @Entity({ name: "table_name" })
    const objectArg = content.match(
      /@Entity\s*\(\s*\{\s*name\s*:\s*["']([^"']+)["']/,
    );
    if (objectArg) return objectArg[1];

    return null;
  }

  extractEntityClass(content: string): string | null {
    const classNames = extractClassNames(content);
    const entityClass = classNames.find(
      (c) => content.includes(`class ${c}`) && content.includes('@Entity'),
    );
    return entityClass ?? classNames[0] ?? null;
  }

  parse(content: string): {
    properties: ParsedProperty[];
    relations: ParsedRelation[];
  } {
    const properties = this.extractTypeORMProperties(content);
    const relations = this.extractTypeORMRelations(content);
    return { properties, relations };
  }

  private extractTypeORMProperties(content: string): ParsedProperty[] {
    const properties: ParsedProperty[] = [];

    // @Column(), @Column({ ... }), @PrimaryColumn(), @PrimaryGeneratedColumn()
    const columnDecorators = [
      '@Column',
      '@PrimaryColumn',
      '@PrimaryGeneratedColumn',
    ] as const;

    for (const decorator of columnDecorators) {
      const decoratorName = decorator.startsWith('@')
        ? decorator
        : `@${decorator}`;
      const regex = new RegExp(
        `${decoratorName}\\s*(?:\\(([^)]*)\\))?\\s*(?:@\\w+[^@]*)*\\s*(?:readonly\\s+)?(\\w+)\\s*[?:!]?\\s*:\\s*([\\w<>\\[\\]|]+)`,
        'g',
      );
      let m: RegExpExecArray | null;
      while ((m = regex.exec(content)) !== null) {
        const opts = m[1] ?? '';
        const dbTypeMatch = opts.match(/type\s*:\s*["'](\w+)["']/);
        const dbType = dbTypeMatch?.[1] ?? null;
        const tsType = m[3].replace(/\[\]$/, '');
        const type = dbType ?? tsType;

        properties.push({
          name: m[2],
          type,
          decorator: decoratorName,
          nullable: opts.includes('nullable'),
          unique: opts.includes('unique'),
        });
      }
    }

    return properties;
  }

  private extractTypeORMRelations(content: string): ParsedRelation[] {
    const relations: ParsedRelation[] = [];
    const relationTypes = ['ManyToOne', 'OneToMany', 'ManyToMany', 'OneToOne'];

    for (const relType of relationTypes) {
      // @ManyToOne(() => User, (user) => user.photos) - second arg gives inversedBy (property on target)
      const relRegex = new RegExp(
        `@${relType}\\s*\\(\\s*\\(\\)\\s*=>\\s*([\\w]+)(?:\\s*,\\s*\\([^)]*\\)\\s*=>\\s*[^.]+\\.([\\w]+))?[^)]*\\)\\s*(?:@\\w+[^@]*)*\\s*(?:readonly\\s+)?([\\w]+)`,
        'g',
      );
      let m: RegExpExecArray | null;
      while ((m = relRegex.exec(content)) !== null) {
        relations.push({
          name: m[3],
          type: relType,
          targetEntity: m[1],
          inversedBy: m[2],
          mappedBy: m[2],
        });
      }
    }

    return relations;
  }
}
