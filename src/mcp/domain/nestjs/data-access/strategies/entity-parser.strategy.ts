export type OrmType = 'mikroorm' | 'typeorm' | 'objection';

export interface ParsedProperty {
  name: string;
  type: string;
  decorator: string;
  nullable: boolean;
  unique: boolean;
}

export interface ParsedRelation {
  name: string;
  type: string;
  targetEntity: string;
  inversedBy?: string;
  mappedBy?: string;
}

export interface EntityParserStrategy {
  readonly orm: OrmType;
  canParse(content: string): boolean;
  extractTableName(content: string): string | null;
  extractEntityClass(content: string): string | null;
  parse(content: string): {
    properties: ParsedProperty[];
    relations: ParsedRelation[];
  };
}
