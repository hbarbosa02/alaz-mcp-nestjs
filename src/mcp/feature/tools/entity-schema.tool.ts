import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { EntityIntrospectorService } from '@/mcp/data-access/services/entity-introspector.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';
import { ProjectRootContextService } from '@/mcp/data-access/services/project-root-context.service';

const projectRootParam = z
  .string()
  .optional()
  .describe('Path to NestJS project root. Overrides MCP config.');

@Injectable()
export class EntitySchemaTool {
  constructor(
    private readonly entityIntrospector: EntityIntrospectorService,
    private readonly mcpLogger: McpLoggerService,
    private readonly projectRootContext: ProjectRootContextService,
  ) {}

  @Tool({
    name: 'get-entity-schema',
    description:
      'Returns entity schema (MikroORM, TypeORM, or Objection): properties, types, relations. ORM is auto-detected from project if omitted.',
    parameters: z.object({
      entityName: z
        .string()
        .describe('Entity name (e.g. User, Tenant, Account)'),
      orm: z
        .enum(['mikroorm', 'typeorm', 'objection'])
        .optional()
        .describe('ORM to use. Auto-detected from project if omitted'),
      projectRoot: projectRootParam,
    }),
  })
  async getEntitySchema(params: {
    entityName: string;
    orm?: 'mikroorm' | 'typeorm' | 'objection';
    projectRoot?: string;
  }): Promise<string> {
    const doWork = async () => {
    this.mcpLogger.logToolInvoked('get-entity-schema', params);
    const schema = await this.entityIntrospector.getEntitySchema(
      params.entityName,
      params.orm,
    );
    if (!schema) {
      const notFoundMsg = `Entity "${params.entityName}" not found.`;
      this.mcpLogger.logToolResult('get-entity-schema', notFoundMsg.length);
      return notFoundMsg;
    }

    const lines: string[] = [
      `# Entity: ${schema.name}`,
      `File: \`${schema.filePath}\``,
      schema.tableName ? `Table: \`${schema.tableName}\`` : '',
      '',
      '## Properties',
      '| Name | Type | Nullable | Unique |',
      '|------|------|----------|--------|',
    ];

    for (const p of schema.properties) {
      lines.push(`| ${p.name} | ${p.type} | ${p.nullable} | ${p.unique} |`);
    }

    if (schema.relations.length > 0) {
      lines.push('', '## Relations');
      lines.push('| Name | Type | Target | inversedBy | mappedBy |');
      lines.push('|------|------|--------|------------|----------|');
      for (const r of schema.relations) {
        lines.push(
          `| ${r.name} | ${r.type} | ${r.targetEntity} | ${r.inversedBy ?? '-'} | ${r.mappedBy ?? '-'} |`,
        );
      }
    }

    const result = lines.join('\n');
    this.mcpLogger.logToolResult('get-entity-schema', result.length);
    return result;
    };
    if (params.projectRoot) {
      return this.projectRootContext.run(params.projectRoot, doWork);
    }
    return doWork();
  }
}
