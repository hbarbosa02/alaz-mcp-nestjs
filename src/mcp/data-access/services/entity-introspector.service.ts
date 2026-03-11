import { Injectable } from '@nestjs/common';
import { FileReaderService } from '@/mcp/util/data-access/services/file-reader.service';
import {
  extractClassNames,
  extractEntityTableName,
  extractMikroORMProperties,
  MikroORMProperty,
  MikroORMRelation,
} from '@/mcp/util/util/parser';

export interface EntitySchema {
  name: string;
  tableName: string | null;
  filePath: string;
  properties: EntityProperty[];
  relations: EntityRelation[];
}

export interface EntityProperty {
  name: string;
  type: string;
  decorator: string;
  nullable: boolean;
  unique: boolean;
}

export interface EntityRelation {
  name: string;
  type: string;
  targetEntity: string;
  inversedBy?: string;
  mappedBy?: string;
}

@Injectable()
export class EntityIntrospectorService {
  constructor(private readonly fileReader: FileReaderService) {}

  async listEntities(): Promise<EntitySchema[]> {
    const files = await this.fileReader.readGlob('src/**/*.entity.ts');
    const schemas: EntitySchema[] = [];

    for (const filePath of files) {
      const content = await this.fileReader.readFile(filePath);
      if (!content) continue;

      const schema = this.parseEntityFile(content, filePath);
      if (schema) schemas.push(schema);
    }

    return schemas;
  }

  async getEntitySchema(entityName: string): Promise<EntitySchema | null> {
    const files = await this.fileReader.readGlob(`src/**/*.entity.ts`);

    for (const filePath of files) {
      const content = await this.fileReader.readFile(filePath);
      if (!content) continue;

      const classNames = extractClassNames(content);
      if (!classNames.includes(entityName)) continue;

      return this.parseEntityFile(content, filePath);
    }

    return null;
  }

  private parseEntityFile(
    content: string,
    filePath: string,
  ): EntitySchema | null {
    const classNames = extractClassNames(content);
    const entityClass =
      classNames.find(
        (c) => content.includes(`class ${c}`) && content.includes('@Entity'),
      ) ?? classNames[0];
    if (!entityClass) return null;

    const tableName = extractEntityTableName(content);
    const { properties, relations } = extractMikroORMProperties(content);

    return {
      name: entityClass,
      tableName,
      filePath,
      properties: properties.map((p) => this.toEntityProperty(p)),
      relations: relations.map((r) => this.toEntityRelation(r)),
    };
  }

  private toEntityProperty(p: MikroORMProperty): EntityProperty {
    return {
      name: p.name,
      type: p.type,
      decorator: p.decorator,
      nullable: p.nullable,
      unique: p.unique,
    };
  }

  private toEntityRelation(r: MikroORMRelation): EntityRelation {
    return {
      name: r.name,
      type: r.type,
      targetEntity: r.targetEntity,
      inversedBy: r.inversedBy,
      mappedBy: r.mappedBy,
    };
  }
}
