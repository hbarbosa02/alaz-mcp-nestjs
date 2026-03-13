import { Inject, Injectable } from '@nestjs/common';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';
import type { IEntityIntrospector } from '@/mcp/core/ports/entity-introspector.port';
import type { EntitySchema } from '@/mcp/core/ports/types';
import {
  ProjectContextService,
  type OrmType,
} from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import {
  ENTITY_PARSER_STRATEGIES,
  type EntityParserStrategies,
} from '../strategies/entity-parser-strategies.token';
import { extractClassNames } from '@/mcp/util/util/parser';

export type { EntitySchema };

const ENTITY_FILE_PATTERN = 'src/**/*.{entity,model}.ts';

@Injectable()
export class EntityIntrospectorService implements IEntityIntrospector {
  constructor(
    private readonly fileReader: FileReaderService,
    private readonly projectContext: ProjectContextService,
    @Inject(ENTITY_PARSER_STRATEGIES)
    private readonly strategies: EntityParserStrategies,
  ) {}

  async listEntities(ormOverride?: OrmType): Promise<EntitySchema[]> {
    const files = await this.fileReader.readGlob(ENTITY_FILE_PATTERN);
    const schemas: EntitySchema[] = [];

    for (const filePath of files) {
      const content = await this.fileReader.readFile(filePath);
      if (!content) continue;

      const schema = await this.parseEntityFile(content, filePath, ormOverride);
      if (schema) schemas.push(schema);
    }

    return schemas;
  }

  async getEntitySchema(
    entityName: string,
    ormOverride?: OrmType,
  ): Promise<EntitySchema | null> {
    const files = await this.fileReader.readGlob(ENTITY_FILE_PATTERN);

    for (const filePath of files) {
      const content = await this.fileReader.readFile(filePath);
      if (!content) continue;

      const classNames = extractClassNames(content);
      if (!classNames.includes(entityName)) continue;

      return this.parseEntityFile(content, filePath, ormOverride);
    }

    return null;
  }

  private async selectStrategy(
    content: string,
    ormOverride?: OrmType,
  ): Promise<EntityParserStrategies[number] | null> {
    if (ormOverride) {
      const strategy = this.strategies.find((s) => s.orm === ormOverride);
      return strategy ?? null;
    }

    const context = await this.projectContext.getContext();
    if (context.orm) {
      const strategy = this.strategies.find((s) => s.orm === context.orm);
      if (strategy) return strategy;
    }

    for (const strategy of this.strategies) {
      if (strategy.canParse(content)) return strategy;
    }

    return null;
  }

  private async parseEntityFile(
    content: string,
    filePath: string,
    ormOverride?: OrmType,
  ): Promise<EntitySchema | null> {
    const strategy = await this.selectStrategy(content, ormOverride);
    if (!strategy) return null;

    const entityClass = strategy.extractEntityClass(content);
    if (!entityClass) return null;

    const tableName = strategy.extractTableName(content);
    const { properties, relations } = strategy.parse(content);

    return {
      name: entityClass,
      tableName,
      filePath,
      properties,
      relations,
    };
  }
}
