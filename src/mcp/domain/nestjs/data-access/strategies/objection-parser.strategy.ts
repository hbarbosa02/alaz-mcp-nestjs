import { Injectable } from '@nestjs/common';
import { extractClassNames } from '@/mcp/util/util/parser';
import type {
  EntityParserStrategy,
  OrmType,
  ParsedProperty,
  ParsedRelation,
} from './entity-parser.strategy';

const OBJECTION_RELATION_MAP: Record<string, string> = {
  HasManyRelation: 'OneToMany',
  BelongsToOneRelation: 'ManyToOne',
  ManyToManyRelation: 'ManyToMany',
  HasOneRelation: 'OneToOne',
};

@Injectable()
export class ObjectionParserStrategy implements EntityParserStrategy {
  readonly orm: OrmType = 'objection';

  canParse(content: string): boolean {
    return content.includes('extends Model');
  }

  extractTableName(content: string): string | null {
    // static tableName = 'users'
    const staticMatch = content.match(
      /static\s+tableName\s*=\s*["']([^"']+)["']/,
    );
    if (staticMatch) return staticMatch[1];

    // static get tableName() { return 'users'; }
    const getterMatch = content.match(
      /static\s+get\s+tableName\s*\(\s*\)\s*\{\s*return\s*["']([^"']+)["']/,
    );
    if (getterMatch) return getterMatch[1];

    return null;
  }

  extractEntityClass(content: string): string | null {
    const classNames = extractClassNames(content);
    const modelClass = classNames.find(
      (c) =>
        content.includes(`class ${c}`) && content.includes('extends Model'),
    );
    return modelClass ?? classNames[0] ?? null;
  }

  parse(content: string): {
    properties: ParsedProperty[];
    relations: ParsedRelation[];
  } {
    const properties = this.extractObjectionProperties(content);
    const relations = this.extractObjectionRelations(content);
    return { properties, relations };
  }

  private extractObjectionProperties(content: string): ParsedProperty[] {
    const properties: ParsedProperty[] = [];

    // declare prop: Type
    const declareRegex = /declare\s+(\w+)\s*[?:]?\s*:\s*([\w<>\[\]|]+)/g;
    let m: RegExpExecArray | null;
    while ((m = declareRegex.exec(content)) !== null) {
      if (['relationMappings', 'tableName', 'idColumn'].includes(m[1]))
        continue;
      properties.push({
        name: m[1],
        type: m[2].replace(/\[\]$/, ''),
        decorator: 'declare',
        nullable: m[0].includes('?'),
        unique: false,
      });
    }

    // jsonSchema.properties
    const jsonSchemaMatch = content.match(
      /jsonSchema\s*[=:]\s*\{[^}]*properties\s*[=:]\s*\{([^}]+)\}/s,
    );
    if (jsonSchemaMatch) {
      const propsBlock = jsonSchemaMatch[1];
      const propMatches = propsBlock.matchAll(/(\w+)\s*[=:]\s*\{([^}]+)\}/g);
      for (const pm of propMatches) {
        const opts = pm[2];
        if (!properties.some((p) => p.name === pm[1])) {
          properties.push({
            name: pm[1],
            type: opts.match(/type\s*[=:]\s*["'](\w+)["']/)?.[1] ?? 'unknown',
            decorator: 'jsonSchema',
            nullable: opts.includes('nullable'),
            unique: opts.includes('unique'),
          });
        }
      }
    }

    return properties;
  }

  private extractObjectionRelations(content: string): ParsedRelation[] {
    const relations: ParsedRelation[] = [];

    const relationMappingsMatch = content.match(
      /relationMappings\s*(?:=\s*)?(?:\{\s*|\(\s*\)\s*=>\s*\{\s*)([\s\S]*?)\s*\}\s*(?:\}\)|;)/,
    );
    if (!relationMappingsMatch) return relations;

    const mappingsBlock = relationMappingsMatch[1];

    const relationBlockRegex =
      /(\w+)\s*[=:]\s*\{\s*relation\s*[=:]\s*Model\.(\w+)[\s\S]*?modelClass\s*[=:]\s*(?:(\w+)|\(\)\s*=>\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\.(\w+))[\s\S]*?(?:join\s*[=:]\s*\{\s*from\s*[=:]\s*['"]([^'"]+)['"]\s*,\s*to\s*[=:]\s*['"]([^'"]+)['"]\s*\})?/g;

    let match: RegExpExecArray | null;
    while ((match = relationBlockRegex.exec(mappingsBlock)) !== null) {
      const relationName = match[1];
      const objectionRelationType = match[2];
      const directModelClass = match[3];
      const requireExport = match[5];
      const joinTo = match[7];

      const normalizedType =
        OBJECTION_RELATION_MAP[objectionRelationType] ?? objectionRelationType;

      let targetEntity: string;
      if (directModelClass) {
        targetEntity = directModelClass;
      } else if (requireExport) {
        targetEntity = requireExport;
      } else if (joinTo) {
        const tableName = joinTo.split('.')[0];
        targetEntity = this.tableNameToEntityName(tableName);
      } else {
        targetEntity = 'Unknown';
      }

      relations.push({
        name: relationName,
        type: normalizedType,
        targetEntity,
        inversedBy: undefined,
        mappedBy: undefined,
      });
    }

    return relations;
  }

  private tableNameToEntityName(tableName: string): string {
    if (!tableName) return 'Unknown';
    const singular = tableName.replace(/s$/, '');
    return singular.charAt(0).toUpperCase() + singular.slice(1);
  }
}
