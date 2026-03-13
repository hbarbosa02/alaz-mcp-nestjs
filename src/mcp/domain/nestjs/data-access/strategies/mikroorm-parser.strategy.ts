import { Injectable } from '@nestjs/common';
import {
  extractClassNames,
  extractEntityTableName,
  extractMikroORMProperties,
} from '@/mcp/util/util/parser';
import type {
  EntityParserStrategy,
  OrmType,
  ParsedProperty,
  ParsedRelation,
} from './entity-parser.strategy';

@Injectable()
export class MikroORMParserStrategy implements EntityParserStrategy {
  readonly orm: OrmType = 'mikroorm';

  canParse(content: string): boolean {
    return content.includes('@Entity') && content.includes('@Property');
  }

  extractTableName(content: string): string | null {
    return extractEntityTableName(content);
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
    const { properties, relations } = extractMikroORMProperties(content);
    return {
      properties: properties.map((p) => ({
        name: p.name,
        type: p.type,
        decorator: p.decorator,
        nullable: p.nullable,
        unique: p.unique,
      })),
      relations: relations.map((r) => ({
        name: r.name,
        type: r.type,
        targetEntity: r.targetEntity,
        inversedBy: r.inversedBy,
        mappedBy: r.mappedBy,
      })),
    };
  }
}
